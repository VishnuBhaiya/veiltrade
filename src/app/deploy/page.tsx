import { AppChrome } from '@/components/AppChrome';
import { DeploymentLaunchpad } from '@/components/DeploymentLaunchpad';

export default function DeployPage(){
  return <AppChrome showWallet={false}><DeploymentLaunchpad/></AppChrome>;
}
