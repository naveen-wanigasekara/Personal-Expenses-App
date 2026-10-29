import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
process.env.DEBUG_PRINT_LIMIT = '1000';
import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react';
const mocks=vi.hoisted(()=>({
 auth:{getSession:vi.fn(),onAuthStateChange:vi.fn(),updateUser:vi.fn(),mfa:{getAuthenticatorAssuranceLevel:vi.fn(),listFactors:vi.fn(),enroll:vi.fn(),unenroll:vi.fn(),challengeAndVerify:vi.fn()}},
 signOut:vi.fn(),signIn:vi.fn(),signUp:vi.fn(),resetPassword:vi.fn(),initCrypto:vi.fn(),clearCrypto:vi.fn(),clearDataSnapshots:vi.fn(),upgradeEncryption:vi.fn(),event:null,
}));
vi.mock('../src/lib/supabase.js',()=>({supabase:{auth:mocks.auth},signOut:mocks.signOut,signIn:mocks.signIn,signUp:mocks.signUp,resetPassword:mocks.resetPassword,initCrypto:mocks.initCrypto,clearCrypto:mocks.clearCrypto,clearDataSnapshots:mocks.clearDataSnapshots}));
vi.mock('../src/lib/dataSecurity.js',()=>({upgradeEncryption:mocks.upgradeEncryption}));
vi.mock('../src/components/MainApp.jsx',()=>({default:()=> <div>Financial workspace</div>}));
import AuthScreen from '../src/components/AuthScreen.jsx';
import RecoveryScreen from '../src/components/RecoveryScreen.jsx';
import MfaScreen from '../src/components/MfaScreen.jsx';
import SecuritySettings from '../src/components/SecuritySettings.jsx';
import App from '../src/App.jsx';
const session={user:{id:'test-user'},access_token:'synthetic-token'};
beforeEach(()=>{
 vi.resetAllMocks(); window.history.replaceState(null,'','/');
 mocks.auth.getSession.mockResolvedValue({data:{session:null}});
 mocks.auth.onAuthStateChange.mockImplementation(fn=>{mocks.event=fn;return {data:{subscription:{unsubscribe:vi.fn()}}}});
 mocks.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({data:{currentLevel:'aal1',nextLevel:'aal1'},error:null});
 mocks.auth.mfa.listFactors.mockResolvedValue({data:{totp:[]},error:null});
 mocks.auth.mfa.challengeAndVerify.mockResolvedValue({data:{},error:null});
 mocks.auth.updateUser.mockResolvedValue({data:{user:session.user},error:null});mocks.signOut.mockResolvedValue({error:null});
 mocks.signIn.mockResolvedValue({error:null});mocks.signUp.mockResolvedValue({error:null});mocks.resetPassword.mockResolvedValue({error:null});
 mocks.initCrypto.mockResolvedValue();mocks.upgradeEncryption.mockResolvedValue();
});
afterEach(cleanup);

describe('security flows with mocked provider boundaries',()=>{
 it('keeps old-password sign-in usable, but rejects weak new signup passwords before provider submission',async()=>{
  render(<AuthScreen/>);expect(screen.getByLabelText('Password').getAttribute('maxlength')).toBeNull();fireEvent.change(screen.getByLabelText('Email'),{target:{value:'synthetic@example.com'}});fireEvent.change(screen.getByLabelText('Password'),{target:{value:'short'}});
  fireEvent.submit(screen.getByRole('button',{name:'Sign in'}).closest('form'));await waitFor(()=>expect(mocks.signIn).toHaveBeenCalledWith('synthetic@example.com','short'));
  fireEvent.click(screen.getByRole('button',{name:'Sign up'}));fireEvent.submit(screen.getByRole('button',{name:'Create account'}).closest('form'));
  await screen.findByRole('alert');expect(mocks.signUp).not.toHaveBeenCalled();
 });
 it('requires matching strong recovery passwords and signs out after confirmed update',async()=>{
  render(<RecoveryScreen session={session} onDone={vi.fn()}/>);
  fireEvent.change(screen.getByLabelText('New password'),{target:{value:'a long synthetic password'}});fireEvent.change(screen.getByLabelText('Confirm new password'),{target:{value:'different'}});
  fireEvent.submit(screen.getByRole('button',{name:'Update password'}).closest('form'));expect(mocks.auth.updateUser).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Confirm new password'),{target:{value:'a long synthetic password'}});fireEvent.submit(screen.getByRole('button',{name:'Update password'}).closest('form'));
  await screen.findByRole('heading',{name:'Password updated'});expect(mocks.auth.updateUser).toHaveBeenCalledWith({password:'a long synthetic password'});expect(mocks.signOut).toHaveBeenCalled();expect(screen.queryByLabelText('New password')).toBeNull();
 });
 it('does not claim recovery success when the provider rejects an expired link',async()=>{
  mocks.auth.updateUser.mockResolvedValue({error:{message:'expired'}});render(<RecoveryScreen session={session} onDone={vi.fn()}/>);
  for(const label of ['New password','Confirm new password']) fireEvent.change(screen.getByLabelText(label),{target:{value:'a long synthetic password'}});
  fireEvent.submit(screen.getByRole('button',{name:'Update password'}).closest('form'));await screen.findByRole('alert');expect(screen.queryByRole('heading',{name:'Password updated'})).toBeNull();expect(mocks.signOut).not.toHaveBeenCalled();
 });
 it('does not unlock on a rejected authenticator code and submits the selected factor on success',async()=>{
  const verified=vi.fn();mocks.auth.mfa.challengeAndVerify.mockResolvedValueOnce({error:{message:'bad code'}});
  render(<MfaScreen factors={[{id:'factor-1'}]} onVerified={verified}/>);fireEvent.change(screen.getByLabelText('Authentication code'),{target:{value:'123456'}});fireEvent.submit(screen.getByRole('button',{name:'Verify'}).closest('form'));await screen.findByRole('alert');expect(verified).not.toHaveBeenCalled();
  fireEvent.submit(screen.getByRole('button',{name:'Verify'}).closest('form'));await waitFor(()=>expect(verified).toHaveBeenCalledOnce());expect(mocks.auth.mfa.challengeAndVerify).toHaveBeenLastCalledWith({factorId:'factor-1',code:'123456'});
 });
 it('offers authenticator setup, safe QR rendering, and confirmation before reporting enabled',async()=>{
  mocks.auth.mfa.enroll.mockResolvedValue({data:{id:'new-factor',totp:{qr_code:'<svg xmlns="http://www.w3.org/2000/svg"></svg>',secret:'SYNTHETICKEY'}},error:null});
  render(<SecuritySettings onClose={vi.fn()}/>);const setup=await screen.findByRole('button',{name:'Set up authenticator'});await waitFor(()=>expect(setup.disabled).toBe(false));fireEvent.click(setup);
  const qr=await screen.findByRole('img',{name:'Authenticator setup QR code'});expect(qr.getAttribute('src')).toMatch(/^data:image\/svg\+xml/);expect(screen.queryByText(/Two-factor authentication is enabled/)).toBeNull();
  fireEvent.change(screen.getByLabelText('Authentication code'),{target:{value:'123456'}});fireEvent.submit(screen.getByRole('button',{name:'Enable two-factor authentication'}).closest('form'));await screen.findByText(/Two-factor authentication is enabled/);expect(mocks.auth.mfa.challengeAndVerify).toHaveBeenCalledWith({factorId:'new-factor',code:'123456'});expect(screen.queryByRole('img')).toBeNull();
 });
 it('recovery events and URL callbacks never mount financial data',async()=>{
  window.history.replaceState(null,'','/?flow=recovery');mocks.auth.getSession.mockResolvedValue({data:{session}});render(<App/>);
  await screen.findByRole('heading',{name:'Choose a new password'});expect(screen.queryByText('Financial workspace')).toBeNull();expect(mocks.initCrypto).not.toHaveBeenCalled();
 });
 it('requires MFA before key acquisition or financial data rendering',async()=>{
  mocks.auth.getSession.mockResolvedValue({data:{session}});mocks.auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({data:{currentLevel:'aal1',nextLevel:'aal2'}});mocks.auth.mfa.listFactors.mockResolvedValue({data:{totp:[{id:'f',status:'verified'}]}});render(<App/>);
  await screen.findByRole('heading',{name:'Verify your sign-in'});expect(mocks.initCrypto).not.toHaveBeenCalled();expect(mocks.upgradeEncryption).not.toHaveBeenCalled();expect(screen.queryByText('Financial workspace')).toBeNull();
 });
 it('keeps records locked on migration failure and permits a safe retry',async()=>{
  mocks.auth.getSession.mockResolvedValue({data:{session}});mocks.upgradeEncryption.mockRejectedValueOnce(Error('stale record'));render(<App/>);await screen.findByRole('heading',{name:'Your data is locked'});expect(screen.queryByText('Financial workspace')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Try again'}));await screen.findByText('Financial workspace');expect(mocks.upgradeEncryption).toHaveBeenCalledTimes(2);
 });
 it('a late key response after signout cannot render the previous account',async()=>{
  let release;mocks.auth.getSession.mockResolvedValue({data:{session}});mocks.initCrypto.mockImplementation(()=>new Promise(r=>{release=r}));render(<App/>);await waitFor(()=>expect(mocks.initCrypto).toHaveBeenCalled());
  await act(async()=>{mocks.event('SIGNED_OUT',null);release();});await screen.findByRole('heading',{name:'Welcome back'});expect(screen.queryByText('Financial workspace')).toBeNull();expect(mocks.upgradeEncryption).not.toHaveBeenCalled();
 });
});
