import { WhatsappSimulator } from './whatsapp-simulator';
import { conversacionesSeed } from './conversaciones-seed';

export const dynamic = 'force-dynamic';

export default function WhatsappSimulatorPage() {
  return <WhatsappSimulator conversaciones={conversacionesSeed} />;
}
