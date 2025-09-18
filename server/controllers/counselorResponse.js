import { response } from "express";
import { counselorResponse } from "../services/service.js";

export async function Response(req, res) {
    try {
        const { userInput } = req.body;

        if (!userInput) {
            return res.status(400).json({ error: "userInput is required" });
        }

        const output = await counselorResponse({ userInput });
        res.status(200).json({ response: output });
    } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
    }
}