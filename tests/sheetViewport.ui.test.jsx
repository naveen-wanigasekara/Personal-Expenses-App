import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import Sheet from '../src/components/Sheet.jsx';

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.style.overflow = ''; });

it('places a sheet outside the view stacking context while retaining React close events', () => {
  const close = vi.fn();
  const { container } = render(<main className="content"><section style={{ transform: 'translateY(0)' }}><Sheet title="New investment" onClose={close}><input aria-label="Name" /></Sheet></section><nav>Navigation</nav></main>);
  const dialog = screen.getByRole('dialog', { name: 'New investment' });
  expect(container.contains(dialog)).toBe(false);
  expect(dialog.parentElement.parentElement).toBe(document.body);
  fireEvent.click(screen.getByLabelText('Name')); expect(close).not.toHaveBeenCalled();
  fireEvent.click(dialog.parentElement); expect(close).toHaveBeenCalledOnce();
});

it('fits the visual viewport when the keyboard opens and removes listeners when closed', () => {
  const viewport = new EventTarget();
  Object.assign(viewport, { height: 760, offsetTop: 0, scale: 1 });
  const remove = vi.spyOn(viewport, 'removeEventListener');
  vi.stubGlobal('visualViewport', viewport);
  const { unmount } = render(<Sheet title="Edit entry" onClose={() => {}}>Form</Sheet>);
  const backdrop = screen.getByRole('dialog').parentElement;
  viewport.height = 330; viewport.offsetTop = 42; fireEvent(viewport, new Event('resize'));
  expect(backdrop.style.height).toBe('330px'); expect(backdrop.style.top).toBe('42px');
  expect(backdrop.style.getPropertyValue('--sheet-viewport-height')).toBe('330px');
  viewport.scale = 2; viewport.height = 160; fireEvent(viewport, new Event('scroll'));
  expect(backdrop.style.height).toBe('330px');
  unmount(); expect(remove).toHaveBeenCalledWith('resize', expect.any(Function)); expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function));
});

it('keeps nested sheets on top, traps focus, restores focus and retains the body lock until all close', () => {
  vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockImplementation(function () { return this.parentElement; });
  function Nested() {
    const [parent, setParent] = useState(true), [child, setChild] = useState(false);
    return parent && <Sheet title="Categories" onClose={() => setParent(false)}><button onClick={() => setChild(true)}>Add category</button>{child && <Sheet title="New category" onClose={() => setChild(false)}><input aria-label="Category name" /><button>Save category</button></Sheet>}</Sheet>;
  }
  document.body.style.overflow = 'auto'; render(<Nested />);
  const opener = screen.getByRole('button', { name: 'Add category' }); opener.focus(); fireEvent.click(opener);
  const save = screen.getByRole('button', { name: 'Save category' }); save.focus(); fireEvent.keyDown(document, { key: 'Tab' });
  expect(document.activeElement).toBe(screen.getByRole('dialog', { name: 'New category' }).querySelector('.close-btn'));
  fireEvent.keyDown(document, { key: 'Escape' }); expect(screen.queryByRole('dialog', { name: 'New category' })).toBeNull();
  expect(screen.getByRole('dialog', { name: 'Categories' })).toBeTruthy(); expect(document.activeElement).toBe(opener); expect(document.body.style.overflow).toBe('hidden');
  fireEvent.keyDown(document, { key: 'Escape' }); expect(document.body.style.overflow).toBe('auto');
});

it('preserves the bank form’s existing viewport-aware portal', () => {
  const { container } = render(<div className="bank-form-layer"><Sheet portal={false} title="Bank details" onClose={() => {}}>Form</Sheet></div>);
  expect(container.querySelector('.bank-form-layer > .backdrop > .sheet')).toBe(screen.getByRole('dialog'));
});
