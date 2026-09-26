import { AppChrome } from '@/components/AppChrome';
import { SettlementWorkbench } from '@/components/SettlementWorkbench';

export default function SettlementPage(){
  return <AppChrome showWallet={false}><SettlementWorkbench/></AppChrome>;
}
