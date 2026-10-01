'use strict';
const { v4: uuidv4 } = require('uuid');

// ─── Static seed IDs for determinism ──────────────────────────────────────────
const ZONE_IDS = {
  academic101: 'a1b2c3d4-0001-0001-0001-000000000001',
  lab102:      'a1b2c3d4-0002-0002-0002-000000000002',
  lab201:      'a1b2c3d4-0003-0003-0003-000000000003',
  hostelB:     'a1b2c3d4-0004-0004-0004-000000000004',
  library:     'a1b2c3d4-0005-0005-0005-000000000005',
  auditorium:  'a1b2c3d4-0006-0006-0006-000000000006',
  researchLab: 'a1b2c3d4-0007-0007-0007-000000000007',
  sports:      'a1b2c3d4-0008-0008-0008-000000000008',
};

const USER_IDS = {
  admin:    'u0000001-0000-0000-0000-000000000001',
  facility: 'u0000002-0000-0000-0000-000000000002',
  security: 'u0000003-0000-0000-0000-000000000003',
  student:  'u0000004-0000-0000-0000-000000000004',
};

const ZONES = [
  { id: ZONE_IDS.academic101, name: 'Academic Block A - Room 101', building: 'Academic Block A', floor: 1, type: 'ACADEMIC', max_capacity: 60, created_at: new Date().toISOString() },
  { id: ZONE_IDS.lab102,      name: 'Computer Lab 102',            building: 'Science Block',     floor: 1, type: 'LAB',      max_capacity: 40, created_at: new Date().toISOString() },
  { id: ZONE_IDS.lab201,      name: 'Electronics Lab 201',         building: 'Engineering Block', floor: 2, type: 'LAB',      max_capacity: 30, created_at: new Date().toISOString() },
  { id: ZONE_IDS.hostelB,     name: 'Hostel B - Common Room',      building: 'Hostel B',          floor: 0, type: 'HOSTEL',   max_capacity: 80, created_at: new Date().toISOString() },
  { id: ZONE_IDS.library,     name: 'Central Library',             building: 'Library Block',     floor: 1, type: 'COMMON_AREA', max_capacity: 200, created_at: new Date().toISOString() },
  { id: ZONE_IDS.auditorium,  name: 'Lecture Hall - Auditorium',   building: 'Academic Block B',  floor: 0, type: 'ACADEMIC', max_capacity: 300, created_at: new Date().toISOString() },
  { id: ZONE_IDS.researchLab, name: 'Research Lab Alpha',          building: 'Research Centre',   floor: 3, type: 'LAB',      max_capacity: 15,  created_at: new Date().toISOString() },
  { id: ZONE_IDS.sports,      name: 'Sports Complex',              building: 'Sports Block',      floor: 0, type: 'COMMON_AREA', max_capacity: 500, created_at: new Date().toISOString() },
];

function makeDevices(zone) {
  return [
    { id: uuidv4(), zone_id: zone.id, name: `${zone.name} - Main Lighting`,    type: 'LIGHTING',       status: 'ON', power_rating_watts: 500,  is_overridden: false, override_until: null, updated_at: new Date().toISOString() },
    { id: uuidv4(), zone_id: zone.id, name: `${zone.name} - HVAC Unit`,         type: 'HVAC',           status: 'ON', power_rating_watts: 2000, is_overridden: false, override_until: null, updated_at: new Date().toISOString() },
    { id: uuidv4(), zone_id: zone.id, name: `${zone.name} - Power Outlets`,     type: 'POWER_OUTLET',   status: 'ON', power_rating_watts: 1000, is_overridden: false, override_until: null, updated_at: new Date().toISOString() },
    { id: uuidv4(), zone_id: zone.id, name: `${zone.name} - Access Control`,    type: 'ACCESS_CONTROL', status: 'ON', power_rating_watts: 50,   is_overridden: false, override_until: null, updated_at: new Date().toISOString() },
    { id: uuidv4(), zone_id: zone.id, name: `${zone.name} - Alarm System`,      type: 'ALARM',          status: 'OFF', power_rating_watts: 100, is_overridden: false, override_until: null, updated_at: new Date().toISOString() },
  ];
}

const DEVICES = ZONES.flatMap(makeDevices);

// password: campus123 (bcrypt hash)
const USERS = [
  { id: USER_IDS.admin,    email: 'admin@campus.edu',    password_hash: '$2b$10$ggKdH5inf8.TvAeJ5mWnjexO6Ivggz7tMcuDXvu9VFs39Iyr9Ze.O', full_name: 'System Administrator', role: 'ADMIN',            created_at: new Date().toISOString() },
  { id: USER_IDS.facility, email: 'facility@campus.edu', password_hash: '$2b$10$ggKdH5inf8.TvAeJ5mWnjexO6Ivggz7tMcuDXvu9VFs39Iyr9Ze.O', full_name: 'Facilities Manager',   role: 'FACILITY_MANAGER', created_at: new Date().toISOString() },
  { id: USER_IDS.security, email: 'security@campus.edu', password_hash: '$2b$10$ggKdH5inf8.TvAeJ5mWnjexO6Ivggz7tMcuDXvu9VFs39Iyr9Ze.O', full_name: 'Security Officer',     role: 'SECURITY',         created_at: new Date().toISOString() },
  { id: USER_IDS.student,  email: 'student@campus.edu',  password_hash: '$2b$10$ggKdH5inf8.TvAeJ5mWnjexO6Ivggz7tMcuDXvu9VFs39Iyr9Ze.O', full_name: 'John Student',         role: 'USER',             created_at: new Date().toISOString() },
];

// In-memory mutable stores
const telemetryStore = {};
ZONES.forEach(z => { telemetryStore[z.id] = []; });

const alertsStore = [];
const auditLogStore = [];

// Schedules (simple time-based events)
const SCHEDULES = [
  { zoneId: ZONE_IDS.academic101, eventName: 'CS101 Lecture', startHour: 9, endHour: 11, days: [1,2,3,4,5] },
  { zoneId: ZONE_IDS.lab102,      eventName: 'Web Dev Lab',   startHour: 14, endHour: 17, days: [1,3,5] },
  { zoneId: ZONE_IDS.library,     eventName: 'Library Hours', startHour: 8,  endHour: 22, days: [1,2,3,4,5,6] },
];

function getCurrentSchedule(zoneId) {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const schedule = SCHEDULES.find(s => s.zoneId === zoneId && s.days.includes(day) && hour >= s.startHour && hour < s.endHour);
  return schedule ? schedule.eventName : null;
}

module.exports = { ZONES, DEVICES, USERS, telemetryStore, alertsStore, auditLogStore, SCHEDULES, getCurrentSchedule, ZONE_IDS, USER_IDS };