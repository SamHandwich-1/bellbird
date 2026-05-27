import { notFound } from 'next/navigation';
import {
  getConversationById,
  getMessagesFor,
  getStressTestFor,
  getAllVerdictsFor,
} from '@/lib/supabase/develop-queries';
import { DevelopChat } from '@/components/shared/develop/DevelopChat';

export const dynamic = 'force-dynamic';

type Params = Promise<{ conversationId: string }>;

export default async function ConversationPage({ params }: { params: Params }) {
  const { conversationId } = await params;
  const conversation = await getConversationById(conversationId);
  if (!conversation) notFound();

  const [messages, stressTest, verdicts] = await Promise.all([
    getMessagesFor(conversationId),
    getStressTestFor(conversationId),
    getAllVerdictsFor(conversationId),
  ]);

  return (
    <DevelopChat
      conversation={conversation}
      initialMessages={messages}
      initialStressTest={stressTest}
      initialVerdicts={verdicts}
    />
  );
}
