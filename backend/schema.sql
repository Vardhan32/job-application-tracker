-- MySQL schema for the Job Application Tracker.
-- The API can create these tables automatically, but this file is handy
-- when setting up the database by hand or reviewing the data model.

CREATE DATABASE IF NOT EXISTS job_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE job_tracker;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS applications (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  company VARCHAR(150) NOT NULL,
  role VARCHAR(150) NOT NULL,
  location VARCHAR(120) NULL,
  work_mode VARCHAR(20) NOT NULL DEFAULT 'onsite',
  source VARCHAR(80) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'applied',
  applied_on DATE NULL,
  salary_min DECIMAL(12, 2) NULL,
  salary_max DECIMAL(12, 2) NULL,
  job_url VARCHAR(500) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_applications_user_status (user_id, status),
  CONSTRAINT fk_applications_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS interviews (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_id INT UNSIGNED NOT NULL,
  round_name VARCHAR(120) NOT NULL,
  scheduled_at DATETIME NOT NULL,
  mode VARCHAR(20) NOT NULL DEFAULT 'video',
  interviewer VARCHAR(150) NULL,
  outcome VARCHAR(20) NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_interviews_application (application_id),
  CONSTRAINT fk_interviews_application
    FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE
) ENGINE=InnoDB;
