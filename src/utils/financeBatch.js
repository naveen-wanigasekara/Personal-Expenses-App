export function createFinanceBatchStore(client, encryptFields, encryptedFields) {
  const snapshots = new Map();
  const keyFor = (table, row) => table === 'budgets' ? row.month_key : table === 'user_settings' ? row.user_id : row.id;
  return {
    clear() { snapshots.clear(); },
    remember(table, rows) {
      for (const row of Array.isArray(rows) ? rows : rows ? [rows] : []) snapshots.set(`${table}:${keyFor(table, row)}`, row);
    },
    async commit(changes) {
      // Capture every precondition before yielding to encryption/network work.
      const prepared = changes.map((change) => {
        if (!encryptedFields[change.table]) throw new Error('Unsupported financial record.');
        const item = { ...change };
        if (item.op !== 'insert') {
          const before = snapshots.get(`${item.table}:${item.id}`);
          if (!before) throw new Error('Refresh your records before saving.');
          item.before = before;
        }
        return item;
      });
      for (const item of prepared) if (item.data) item.data = await encryptFields(item.data, encryptedFields[item.table]);
      const { data, error } = await client.rpc('apply_finance_changes', { changes: prepared });
      if (error) throw error;
      if (!Array.isArray(data) || data.length !== prepared.length || data.some((result, i) => result.table !== prepared[i].table || result.id !== prepared[i].id || (prepared[i].op !== 'delete' && !result.row))) throw new Error('The save could not be confirmed. Refresh your records.');
      for (const result of data) {
        if (result.row) this.remember(result.table, result.row);
        else snapshots.delete(`${result.table}:${result.id}`);
      }
      return data;
    },
  };
}
