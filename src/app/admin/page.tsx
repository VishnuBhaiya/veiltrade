import { AppChrome } from '@/components/AppChrome';
import { AdminConsole } from '@/components/AdminConsole';

export default function AdminPage(){
  return <AppChrome showWallet={false}><div className="content-stack"><AdminConsole/></div></AppChrome>;
}
