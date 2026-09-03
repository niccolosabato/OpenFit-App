CREATE TABLE `body_measurements` (
	`id` text PRIMARY KEY NOT NULL,
	`measured_on` text NOT NULL,
	`weight` real,
	`body_fat` real,
	`neck` real,
	`chest` real,
	`waist` real,
	`hips` real,
	`arm_left` real,
	`arm_right` real,
	`thigh_left` real,
	`thigh_right` real,
	`calf` real,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_body_measured_on` ON `body_measurements` (`measured_on`);--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`aliases` text,
	`primary_muscle` text NOT NULL,
	`secondary_muscles` text DEFAULT '[]' NOT NULL,
	`equipment` text NOT NULL,
	`mechanic` text DEFAULT 'isolation' NOT NULL,
	`tracking_type` text DEFAULT 'weight_reps' NOT NULL,
	`is_unilateral` integer DEFAULT false NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL,
	`is_favorite` integer DEFAULT false NOT NULL,
	`instructions` text,
	`default_rest_seconds` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`archived_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_exercises_primary_muscle` ON `exercises` (`primary_muscle`);--> statement-breakpoint
CREATE INDEX `idx_exercises_equipment` ON `exercises` (`equipment`);--> statement-breakpoint
CREATE INDEX `idx_exercises_name` ON `exercises` (`name`);--> statement-breakpoint
CREATE TABLE `personal_records` (
	`id` text PRIMARY KEY NOT NULL,
	`exercise_id` text NOT NULL,
	`type` text NOT NULL,
	`reps` integer DEFAULT 0 NOT NULL,
	`value` real NOT NULL,
	`weight` real,
	`achieved_reps` integer,
	`session_set_id` text,
	`session_id` text,
	`achieved_at` integer NOT NULL,
	`previous_value` real,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_set_id`) REFERENCES `session_sets`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`session_id`) REFERENCES `workout_sessions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_pr_exercise_type_reps` ON `personal_records` (`exercise_id`,`type`,`reps`);--> statement-breakpoint
CREATE INDEX `idx_pr_exercise` ON `personal_records` (`exercise_id`);--> statement-breakpoint
CREATE TABLE `routine_days` (
	`id` text PRIMARY KEY NOT NULL,
	`routine_id` text NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`order_index` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_routine_days_routine` ON `routine_days` (`routine_id`,`order_index`);--> statement-breakpoint
CREATE TABLE `routine_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`day_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`superset_group` integer,
	`rest_seconds` integer,
	`notes` text,
	FOREIGN KEY (`day_id`) REFERENCES `routine_days`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_routine_exercises_day` ON `routine_exercises` (`day_id`,`order_index`);--> statement-breakpoint
CREATE TABLE `routine_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`routine_exercise_id` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`set_type` text DEFAULT 'working' NOT NULL,
	`technique` text,
	`target_reps_min` integer,
	`target_reps_max` integer,
	`target_weight` real,
	`target_rpe` real,
	`target_rir` integer,
	`target_duration_seconds` integer,
	`target_distance_meters` real,
	`rest_seconds_override` integer,
	`notes` text,
	FOREIGN KEY (`routine_exercise_id`) REFERENCES `routine_exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_routine_sets_exercise` ON `routine_sets` (`routine_exercise_id`,`order_index`);--> statement-breakpoint
CREATE TABLE `routines` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`notes` text,
	`order_index` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`archived_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_routines_order` ON `routines` (`order_index`);--> statement-breakpoint
CREATE TABLE `session_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`superset_group` integer,
	`rest_seconds` integer,
	`notes` text,
	FOREIGN KEY (`session_id`) REFERENCES `workout_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_session_exercises_session` ON `session_exercises` (`session_id`,`order_index`);--> statement-breakpoint
CREATE INDEX `idx_session_exercises_exercise` ON `session_exercises` (`exercise_id`);--> statement-breakpoint
CREATE TABLE `session_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`session_exercise_id` text NOT NULL,
	`parent_set_id` text,
	`order_index` integer DEFAULT 0 NOT NULL,
	`set_type` text DEFAULT 'working' NOT NULL,
	`technique` text,
	`weight` real,
	`reps` integer,
	`rpe` real,
	`rir` integer,
	`duration_seconds` integer,
	`distance_meters` real,
	`is_completed` integer DEFAULT false NOT NULL,
	`is_pr` integer DEFAULT false NOT NULL,
	`notes` text,
	`completed_at` integer,
	FOREIGN KEY (`session_exercise_id`) REFERENCES `session_exercises`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parent_set_id`) REFERENCES `session_sets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_session_sets_exercise` ON `session_sets` (`session_exercise_id`,`order_index`);--> statement-breakpoint
CREATE INDEX `idx_session_sets_parent` ON `session_sets` (`parent_set_id`);--> statement-breakpoint
CREATE INDEX `idx_session_sets_completed` ON `session_sets` (`completed_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_name` text,
	`birth_year` integer,
	`height_cm` real,
	`goal` text,
	`experience` text,
	`unit` text DEFAULT 'kg' NOT NULL,
	`accent` text DEFAULT 'volt' NOT NULL,
	`default_rest_seconds` integer DEFAULT 90 NOT NULL,
	`auto_start_timer` integer DEFAULT true NOT NULL,
	`timer_sound` integer DEFAULT true NOT NULL,
	`timer_vibration` integer DEFAULT true NOT NULL,
	`timer_notification` integer DEFAULT true NOT NULL,
	`effort_scale` text DEFAULT 'rpe' NOT NULL,
	`keep_awake` integer DEFAULT true NOT NULL,
	`prefill_from_previous` integer DEFAULT true NOT NULL,
	`bar_weight` real DEFAULT 20 NOT NULL,
	`plate_inventory` text DEFAULT '[]' NOT NULL,
	`first_day_of_week` integer DEFAULT 1 NOT NULL,
	`weekly_session_goal` integer DEFAULT 4 NOT NULL,
	`onboarding_completed` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workout_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`routine_id` text,
	`routine_day_id` text,
	`name` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`duration_seconds` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`notes` text,
	`bodyweight` real,
	`perceived_effort` integer,
	`total_volume` real DEFAULT 0 NOT NULL,
	`total_sets` integer DEFAULT 0 NOT NULL,
	`total_reps` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`routine_day_id`) REFERENCES `routine_days`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_started` ON `workout_sessions` (`started_at`);--> statement-breakpoint
CREATE INDEX `idx_sessions_status` ON `workout_sessions` (`status`);