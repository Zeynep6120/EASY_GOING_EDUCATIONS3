# Database Setup

## Automatic Table Creation

The database tables are automatically created when the server starts. The `db/init.js` file is called automatically by `server.js`.

## Manual Table Creation

If you need to create tables manually, you have two options:

### Option 1: Using npm script (Recommended)
```bash
npm run db:init
```
or
```bash
npm run db:create
```

### Option 2: Direct Node execution
```bash
node db/createTables.js
```

### Option 3: Using PostgreSQL CLI
```bash
psql -U your_username -d your_database_name -f schema.sql
```

## What Gets Created

The script creates all necessary tables:
- Core tables: users, teachers, students
- Academic tables: education_terms, lessons, lesson_programs
- Relationship tables: program_lessons, teacher_programs, student_programs
- Performance tables: student_info
- Meeting tables: meets, meet_students
- Content tables: contact_messages, courses, instructors, events, slides

## Notes

- Tables use `IF NOT EXISTS` so running the script multiple times is safe
- Existing tables will be skipped
- Check console output for creation status

