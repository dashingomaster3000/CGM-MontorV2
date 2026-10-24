// Demo data for the History page.
// Each patient has an id, a name, a list of days with measurements (mmol/L) and symptoms.
// The id is used in the URL, e.g. History.html?patient=1
const patients = [
    {
        id: 1,
        name: "Test",
        days: [
            { date: "2026-10-10", values: [6.2, 7.8, 9.1, 5.4] },
            { date: "2026-10-11", values: [5.9, 8.4, 10.6, 6.1] },
            { date: "2026-10-12", values: [3.6, 7.2, 8.8, 5.7] },
            { date: "2026-10-13", values: [6.4, 9.3, 11.2, 7.0] },
            { date: "2026-10-14", values: [5.5, 7.1, 8.0, 4.9] },
            { date: "2026-10-15", values: [4.1, 6.8, 9.9, 5.2] },
            { date: "2026-10-16", values: [3.4, 6.5, 8.7, 6.0] },
            { date: "2026-10-17", values: [6.0, 7.7, 9.4, 5.8] },
            { date: "2026-10-18", values: [3.1, 5.9, 8.2, 6.3] },
            { date: "2026-10-19", values: [5.6, 8.9, 10.2, 6.6] },
            { date: "2026-10-20", values: [6.1, 7.4, 8.5, 5.3] },
            { date: "2026-10-21", values: [5.8, 9.0, 12.1, 6.9] },
            { date: "2026-10-22", values: [3.7, 6.6, 7.9, 5.1] },
            { date: "2026-10-23", values: [4.2, 7.0, 8.6, 5.5] }
        ],
        symptoms: [
            { date: "2026-10-18", text: "CR7" }
        ]
    },
    {
        id: 2,
        name: "Test",
        days: [],
        symptoms: [
            { date: "2026-10-22", text: "Juice mad" }
        ]
    }
];
