# Manual Test Checklist

## Backend API

- [ ] `GET /api/health` returns API running message.
- [ ] `POST /api/tasks` creates a task with required title.
- [ ] Validation fails when title is empty.
- [ ] `GET /api/tasks` returns all tasks.
- [ ] `GET /api/tasks?status=Done` filters correctly.
- [ ] `GET /api/tasks?priority=High` filters correctly.
- [ ] `GET /api/tasks/:id` returns selected task.
- [ ] `PUT /api/tasks/:id` updates status/priority/deadline/assignment.
- [ ] `DELETE /api/tasks/:id` removes task.

## Frontend UI

- [ ] Task can be created from form.
- [ ] Created task appears in list immediately.
- [ ] Task can be edited inline.
- [ ] Task can be deleted.
- [ ] Status badge displays correctly.
- [ ] Priority badge displays correctly.
- [ ] Deadline displays correctly.
- [ ] Assigned username displays correctly.
- [ ] Status filter updates list.
- [ ] Priority filter updates list.
- [ ] Reset filter brings all tasks back.

## Final Pre-Submission

- [ ] Backend runs without runtime errors.
- [ ] Frontend runs without runtime errors.
- [ ] README setup steps are accurate.
- [ ] Report includes architecture and features.
- [ ] Deployment intentionally skipped.
