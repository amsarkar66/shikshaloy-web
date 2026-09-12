create table inventory_activity_log (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references inventory_items(id) on delete cascade,
  school_id uuid not null references schools(id),
  event_type text not null,      -- 'created' | 'updated' | 'stock_adjusted'
  description text not null,
  delta integer,                 -- signed qty change, only set for 'stock_adjusted'
  reason text,
  actor_name text not null,
  created_at timestamptz not null default now()
);

create index inventory_activity_log_item_idx on inventory_activity_log(item_id, created_at desc);
