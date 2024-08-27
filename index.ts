const CANVAS_API = "https://canvas.dev.cdl.ucf.edu";
const API_KEY =
  "aIL0mppPgNbDl4D4fq5naD61GSnjfQAv64rLrYcwm9TAvdU7gS8IVSp8epyjbBGF";

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

const url = `${CANVAS_API}/api/v1/courses`;

console.log("making request to", url);
const response = await fetch(url, { headers, method: "GET" });
const data = await response.json();
console.log("response", data);

export {};

