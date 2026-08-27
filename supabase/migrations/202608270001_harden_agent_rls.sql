drop policy if exists agent_calls on public.calls;
create policy agent_calls on public.calls for all
using (
  agent_id=public.current_agent_id()
  and exists(select 1 from public.client_assignments ca where ca.client_id=calls.client_id and ca.agent_id=public.current_agent_id() and ca.status='active')
)
with check (
  agent_id=public.current_agent_id()
  and exists(select 1 from public.client_assignments ca where ca.client_id=calls.client_id and ca.agent_id=public.current_agent_id() and ca.status='active')
);

drop policy if exists agent_notes on public.notes;
create policy agent_notes on public.notes for all
using (
  agent_id=public.current_agent_id()
  and exists(select 1 from public.client_assignments ca where ca.client_id=notes.client_id and ca.agent_id=public.current_agent_id() and ca.status='active')
)
with check (
  agent_id=public.current_agent_id()
  and exists(select 1 from public.client_assignments ca where ca.client_id=notes.client_id and ca.agent_id=public.current_agent_id() and ca.status='active')
);

drop policy if exists agent_callbacks on public.callbacks;
create policy agent_callbacks on public.callbacks for all
using (
  agent_id=public.current_agent_id()
  and exists(select 1 from public.client_assignments ca where ca.client_id=callbacks.client_id and ca.agent_id=public.current_agent_id() and ca.status='active')
)
with check (
  agent_id=public.current_agent_id()
  and exists(select 1 from public.client_assignments ca where ca.client_id=callbacks.client_id and ca.agent_id=public.current_agent_id() and ca.status='active')
);
