
-- Add call rates and subscription plans to app_settings
ALTER TABLE public.app_settings
ADD COLUMN video_call_rate INTEGER NOT NULL DEFAULT 5,
ADD COLUMN audio_call_rate INTEGER NOT NULL DEFAULT 3,
ADD COLUMN subscription_plans JSONB NOT NULL DEFAULT '[
  {"name":"Weekly","price":"₹99","amount":99,"period":"/week","popular":false,"features":["Unlimited likes","See who liked you","Priority matching"]},
  {"name":"Monthly","price":"₹299","amount":299,"period":"/month","popular":true,"features":["All Weekly features","Super likes x5","Profile boost","Read receipts"]},
  {"name":"Yearly","price":"₹1,999","amount":1999,"period":"/year","popular":false,"features":["All Monthly features","VIP badge","Advanced filters","Undo swipes"]}
]'::jsonb;
