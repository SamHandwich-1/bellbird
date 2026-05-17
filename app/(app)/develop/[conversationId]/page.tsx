import { notFound } from 'next/navigation';
import {
  getConversationById,
  getMessagesFor,
  getStressTestFor,
  getAllVerdictsFor,
  getTokenUsageFor,
} from '@/lib/supabase/develop-queries';
import { DevelopChat } from '@/components/develop/DevelopChat';

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const conversation = await getConversationById(conversationId);
  if (!conversation) notFound();

  const [messages, stressTest, verdicts, usage] = await Promise.all([
    getMessagesFor(conversationId),
    getStressTestFor(conversationId),
    getAllVerdictsFor(conversationId),
    getTokenUsageFor(conversationId),
  ]);

  return (
    <DevelopChat
      conversation={conversation}
      initialMessages={messages}
      initialStressTest={stressTest}
      initialVerdicts={verdicts}
      initialUsage={usage}
    />
  );
}
