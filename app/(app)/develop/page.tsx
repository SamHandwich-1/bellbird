import { getConversations } from '@/lib/supabase/develop-queries';
import { ConversationList } from '@/components/develop/ConversationList';
import { NewConversationButton } from '@/components/develop/NewConversationButton';
import { tokens } from '@/lib/tokens';

export default async function DevelopPage() {
  const conversations = await getConversations();

  return (
    <div className="pt-12">
      <div className="flex items-baseline justify-between mb-12 flex-wrap gap-4">
        <div>
          <div
            className="font-sans text-[10px] tracking-[0.22em] uppercase mb-2"
            style={{ color: tokens.whisper }}
          >
            Develop
          </div>
          <h1
            className="font-serif text-[44px] tracking-tight"
            style={{ fontWeight: 340 }}
          >
            Conversations
          </h1>
          <p
            className="mt-3 font-serif text-[15px] leading-[1.55] max-w-[58ch]"
            style={{ fontWeight: 340, color: tokens.ash }}
          >
            Develop a thesis through deliberate back-and-forth. Opus pushes back in
            development, Sonnet structures, Grok stress-tests, Opus adjudicates. Only
            verdicts of PROCEED commit to the library.
          </p>
        </div>
        <NewConversationButton />
      </div>

      <div className="hairline mb-10" />

      <ConversationList conversations={conversations} />
    </div>
  );
}
