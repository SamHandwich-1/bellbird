import { StubScreen } from '@/components/shared/StubScreen';

export default function Page() {
  return (
    <StubScreen
      mode="Library"
      title="Theses"
      turn={2}
      description="The book — nineteen theses with cycle-stage badges, full CRUD, filters by stage and portfolio status, and inline position editing. Lands in Turn 2 alongside Supabase auth."
    />
  );
}
