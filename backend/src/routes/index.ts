import { Router } from 'express';

const modules = ['auth', 'income', 'expenses', 'investments', 'emi_loans', 'reminders', 'analytics'];

export const apiRouter = Router();

modules.forEach((name) => {
  apiRouter.get(`/${name}`, (_req, res) => {
    res.json({ module: name, status: 'ok' });
  });
});
