import express, { Router } from "express";
const userRoute: Router = express.Router();

import registerValidation from "../../../validations/user/auth/register";


export default userRoute;