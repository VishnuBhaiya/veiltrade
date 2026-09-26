import { AppChrome } from '@/components/AppChrome';
import { RegulatorConsole } from '@/components/RegulatorConsole';

export default function RegulatorPage(){
  return <AppChrome showWallet={false}><div className="content-stack"><RegulatorConsole/></div></AppChrome>;
}
