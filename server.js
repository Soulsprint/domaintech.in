const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const ExcelJS = require("exceljs");
const path = require("path");
 // Import ExcelJS
const app = express();
const port = 1080;
const crypto = require('crypto');
// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Pass@123', // Keep empty for no password
    database: 'u270167502_task_manage',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
// Create MySQL connection pool
const db = mysql.createPool(dbConfig);


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Check MySQL connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection error:', err);
    } else {
        console.log('✅ Database connected!');
        connection.release();
    }
});

// Add Task API
app.post('/add-task', (req, res) => {
    const { name, number, accessories, problem_reported, timeline, assigned_to } = req.body;

    if (!name || !number || !accessories || !problem_reported || !timeline) {
        return res.status(400).json({ message: '❌ Missing required fields' });
    }

    const query1 = `
        INSERT INTO task (name, number, accessories, problem_reported, timeline, assigned_to) 
        VALUES (?, ?, ?, ?, ?, NULL)`;

    // const query2 = `
    //     INSERT INTO allTask (name, number, accessories, problem_reported, timeline, assigned_to) 
    //     VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(query1, [name, number, accessories, problem_reported, timeline, assigned_to || null], (err, result) => {
        if (err) {
            return res.status(500).json({ message: '❌ Error adding task', error: err.sqlMessage });
        }

        // Insert into second table
        // db.query(query2, [name, number, accessories, problem_reported, timeline, assigned_to || null], (err2) => {
        //     if (err2) {
        //         return res.status(500).json({ message: '❌ Error adding task to allTask', error: err2.sqlMessage });
        //     }

            res.status(200).json({ message: '✅ Task added successfully', task_id: result.insertId });
        });
    });



// Assign Task API
app.post('/assign-task', (req, res) => {
    const { task_id, assigned_to } = req.body;
`12 `
    if (!task_id || !assigned_to) {
        return res.status(400).json({ message: '❌ Missing task ID or assigned person' });
    }

    const query = 'UPDATE task SET assigned_to = ? WHERE id = ?';
    db.query(query, [assigned_to, task_id], (err) => {
        if (err) {
            return res.status(500).json({ message: '❌ Error assigning task', error: err.sqlMessage });
        }
        res.status(200).json({ message: `✅ Task assigned to ${assigned_to}` });
    });
});

// Store Task API
// Store Task in Storage Table API
// Store Task in Storage
app.post('/store-task', (req, res) => {
    const { name, number, accessories, problem_reported, timeline } = req.body;
    const query = `INSERT INTO storage (name, number, accessories, problem_reported, timeline, status) VALUES (?, ?, ?, ?, ?, 'stored')`;

    db.query(query, [name, number, accessories, problem_reported, timeline], (err, result) => {
        if (err) {
            console.error('❌ Error storing task:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.status(201).json({ message: '✅ Task stored successfully', insertId: result.insertId });
    });
});





// Assign Task from Storage to Employee API
// app.post('/assign-from-storage', (req, res) => {
//     const { timeline } = req.body;

//     if (!timeline) {
//         return res.status(400).json({ message: "❌ Missing timeline value" });
//     }

//     console.log(`🔄 Assigning tasks from storage for Timeline: ${timeline}`);

//     db.beginTransaction((err) => {
//         if (err) {
//             console.error("❌ Transaction start error:", err);
//             return res.status(500).json({ message: "❌ Error starting transaction" });
//         }

//         // Step 1: Retrieve tasks from storage
//         const selectQuery = `SELECT * FROM storage WHERE timeline = ?`;
//         db.query(selectQuery, [timeline], (err, results) => {
//             if (err) {
//                 console.error("❌ Database error (Fetching tasks from storage):", err);
//                 return db.rollback(() => {
//                     res.status(500).json({ message: "❌ Database error", error: err.sqlMessage });
//                 });
//             }

//             if (results.length === 0) {
//                 console.log("❌ No tasks found in storage for this timeline.");
//                 return res.status(404).json({ message: "❌ No tasks found in storage for this timeline" });
//             }

//             console.log("✅ Tasks found in storage:", results);

//             // Step 2: Insert tasks into `task` table
//             const insertQuery = `
//                 INSERT INTO task (name, number, accessories, problem_reported, timeline, assigned_to, status) 
//                 VALUES ?
//             `;

//             const taskValues = results.map((task) => [
//                 task.name,
//                 task.number,
//                 task.accessories,
//                 task.problem_reported,
//                 task.timeline, // Timeline remains the same
//                 task.timeline, // Assign to employee with the same timeline
//                 "active"
//             ]);

//             db.query(insertQuery, [taskValues], (err, insertResult) => {
//                 if (err) {
//                     console.error("❌ Database error (Inserting into task table):", err);
//                     return db.rollback(() => {
//                         res.status(500).json({ message: "❌ Error inserting tasks", error: err.sqlMessage });
//                     });
//                 }

//                 console.log("✅ Tasks successfully assigned:", insertResult.affectedRows);

//                 // Step 3: Delete tasks from storage based on `timeline`
//                 const deleteQuery = `DELETE FROM storage WHERE timeline = ?`;
//                 console.log(`🟠 Deleting tasks with timeline '${timeline}' from storage...`);

//                 db.query(deleteQuery, [timeline], (err, deleteResult) => {
//                     if (err) {
//                         console.error("❌ Database error (Deleting from storage):", err);
//                         return db.rollback(() => {
//                             res.status(500).json({ message: "❌ Error deleting tasks from storage", error: err.sqlMessage });
//                         });
//                     }

//                     console.log(`✅ Tasks deleted from storage: ${deleteResult.affectedRows}`);

//                     // Commit Transaction
//                     db.commit((err) => {
//                         if (err) {
//                             console.error("❌ Transaction commit error:", err);
//                             return db.rollback(() => {
//                             res.status(500).json({ message: "❌ Error finalizing transaction" });
//                             });
//                         }

//                         res.status(200).json({ message: "✅ Tasks assigned and removed from storage successfully!" });
//                     });
//                 });
//             });
//         });
//     });
// });


// **2️⃣ Fetch tasks stored in the storage table**
app.get('/storage-tasks', (req, res) => {
    const query = "SELECT * FROM storage";

    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Database error while fetching storage tasks:", err);
            return res.status(500).json({ message: "❌ Error retrieving storage tasks", error: err.sqlMessage });
        }

        console.log("✅ Storage tasks retrieved:", results);
        res.status(200).json(results);
    });
});
app.delete('/delete-stored-task/:taskId', (req, res) => {
    const { taskId } = req.params;
    const query = `DELETE FROM storage WHERE id = ?`;

    db.query(query, [taskId], (err, result) => {
        if (err) {
            console.error('❌ Error deleting stored task:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.status(200).json({ message: '✅ Task deleted successfully' });
    });
});


app.post('/assign-task', (req, res) => {
    const { task_id, assigned_to } = req.body;
    const query = `UPDATE storage SET assigned_to = ? WHERE id = ?`;

    db.query(query, [assigned_to, task_id], (err, result) => {
        if (err) {
            console.error('❌ Error assigning task:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.status(200).json({ message: '✅ Task assigned successfully' });
    });
});


// **3️⃣ Fetch active tasks assigned to an employee (by timeline)**
app.get('/tasks/:timeline', (req, res) => {
    const { timeline } = req.params;

    console.log("Fetching tasks for Employee ID:", timeline);

    const query = `SELECT * FROM task WHERE timeline = ? `;

    db.query(query, [timeline], (err, results) => {
        if (err) {
            console.error("❌ Database error:", err);
            return res.status(500).json({ message: "❌ Error retrieving tasks", error: err.sqlMessage });
        }

        console.log("✅ Tasks retrieved:", results);
        res.status(200).json(results);
    });
});


// Delete Task API (Remove from Database)
app.delete('/delete-task/:timeline', (req, res) => {
    const timeline = req.params.timeline;

    if (!timeline) {
        return res.status(400).json({ success: false, message: "Missing timeline value" });
    }

    const deleteQuery = `DELETE FROM task WHERE timeline = ?`;

    db.query(deleteQuery, [timeline], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ success: false, message: "Database error", error: err.sqlMessage });
        }

        if (result.affectedRows > 0) {
            res.status(200).json({ success: true, message: "Task(s) deleted successfully" });
        } else {
            res.status(404).json({ success: false, message: "No tasks found with the given timeline" });
        }
    });
});


// Move Task to Completed Table Instead of Deleting
app.post('/complete-task/:taskId', (req, res) => {
    const taskId = req.params.taskId;

    if (!taskId) {
        return res.status(400).json({ success: false, message: "❌ Missing task ID" });
    }

    console.log(`🔄 Completing task with ID: ${taskId}`);

    const selectQuery = `SELECT * FROM task WHERE id = ?`;
    db.query(selectQuery, [taskId], (err, results) => {
        if (err) {
            console.error("❌ Database error (Fetching task):", err);
            return res.status(500).json({ success: false, message: "Database error", error: err.sqlMessage });
        }

        if (results.length === 0) {
            console.log("❌ Task not found in DB.");
            return res.status(404).json({ success: false, message: "Task not found" });
        }

        const task = results[0];
        console.log("✅ Task found:", task);

        const insertQuery = `
            INSERT INTO completed_tasks (name, number, accessories, problem_reported, timeline, assigned_to) 
            VALUES (?, ?, ?, ?, ?, ?)`;

        db.query(insertQuery, [task.name, task.number, task.accessories, task.problem_reported, task.timeline, task.assigned_to], (err) => {
            if (err) {
                console.error("❌ Database error (Inserting into completed_tasks):", err);
                return res.status(500).json({ success: false, message: "Error moving task", error: err.sqlMessage });
            }

            console.log("✅ Task successfully moved to completed_tasks!");

            const deleteQuery = `DELETE FROM task WHERE id = ?`;
            db.query(deleteQuery, [taskId], (err) => {
                if (err) {
                    console.error("❌ Database error (Deleting from task table):", err);
                    return res.status(500).json({ success: false, message: "Error deleting task", error: err.sqlMessage });
                }

                console.log("✅ Task successfully deleted from task table!");
                res.status(200).json({ success: true, message: "✅ Task completed and moved successfully!" });
            });
        });
    });
});

// Fetch completed tasks based on timeline (Employee ID)
app.get('/completed-tasks/:timeline', (req, res) => {
    const { timeline } = req.params;
    console.log(`Fetching completed tasks for Timeline: ${timeline}`);

    const query = `SELECT * FROM completed_tasks WHERE timeline = ?`;

    db.query(query, [timeline], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: '❌ Error retrieving completed tasks', error: err.sqlMessage });
        }
        console.log("✅ Completed tasks retrieved:", results);
        res.status(200).json(results);
    });
});
// Approve Task API (Move to approved_tasks table)
app.post("/reject-task/:taskId", (req, res) => {
    const taskId = req.params.taskId;
    const { note, assigned_to } = req.body;

    console.log(`🔍 Rejecting Task ID: ${taskId} with Note: ${note}`);

    const fetchTaskQuery = "SELECT * FROM completed_tasks WHERE id = ?";
    db.query(fetchTaskQuery, [taskId], (err, results) => {
        if (err) {
            console.error("❌ Database error while fetching task:", err);
            return res.status(500).json({ success: false, message: "Database error while fetching task." });
        }

        if (results.length === 0) {
            console.warn(`⚠️ Task ID ${taskId} not found in completed_tasks.`);
            return res.status(404).json({ success: false, message: "❌ Task not found in completed tasks." });
        }

        const task = results[0];

        // Insert into rejected_tasks (without status column)
        const insertQuery = `
            INSERT INTO rejected_tasks (task_id, name, number, accessories, problem_reported, timeline, assigned_to, rejection_note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(insertQuery, [task.id, task.name, task.number, task.accessories, task.problem_reported, task.timeline, assigned_to || null, note], (err) => {
            if (err) {
                console.error("❌ Database error while inserting rejected task:", err);
                return res.status(500).json({ success: false, message: "Database error while inserting rejected task." });
            }

            // Delete the task from completed_tasks
            const deleteQuery = "DELETE FROM completed_tasks WHERE id = ?";
            db.query(deleteQuery, [taskId], (err) => {
                if (err) {
                    console.error("❌ Error deleting task from completed_tasks:", err);
                    return res.status(500).json({ success: false, message: "Task rejected but could not be deleted from completed tasks." });
                }

                console.log(`✅ Task ${taskId} moved to rejected_tasks successfully!`);
                return res.json({ success: true, message: "✅ Task rejected successfully!" });
            });
        });
    });
});

app.post('/approve-task/:taskId', (req, res) => {
    const taskId = req.params.taskId;

    console.log(`✅ Approving Task ID: ${taskId}`);

    const fetchTaskQuery = "SELECT * FROM completed_tasks WHERE id = ?";
    db.query(fetchTaskQuery, [taskId], (err, results) => {
        if (err) {
            console.error("❌ Database error while fetching task:", err);
            return res.status(500).json({ success: false, message: "Database error while fetching task." });
        }

        if (results.length === 0) {
            console.warn(`⚠️ Task ID ${taskId} not found in completed_tasks.`);
            return res.status(404).json({ success: false, message: "❌ Task not found in completed tasks." });
        }

        const task = results[0];

        console.log("✅ Task found:", task);

        // Get the current timestamp
        const approvalTime = new Date().toISOString().slice(0, 19).replace("T", " "); 

        // Insert into approved_tasks table with approval timestamp in created_at
        const insertQuery = `
            INSERT INTO approved_tasks (name, number, accessories, problem_reported, timeline, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(insertQuery, [task.name, task.number, task.accessories, task.problem_reported, task.timeline, "approved", approvalTime], (err, result) => {
            if (err) {
                console.error("❌ Database error while inserting approved task:", err);
                return res.status(500).json({ success: false, message: "Database error while inserting approved task.", error: err.sqlMessage });
            }

            console.log("✅ Task successfully inserted into approved_tasks:", result);

            // Delete the task from completed_tasks
            const deleteQuery = "DELETE FROM completed_tasks WHERE id = ?";
            db.query(deleteQuery, [taskId], (err, deleteResult) => {
                if (err) {
                    console.error("❌ Error deleting task from completed_tasks:", err);
                    return res.status(500).json({ success: false, message: "Task approved but could not be deleted from completed tasks." });
                }

                console.log(`✅ Task ${taskId} moved to approved_tasks successfully!`);
                return res.json({ success: true, message: "✅ Task approved successfully!", created_at: approvalTime });
            });
        });
    });
});


// Fetch rejected tasks based on timeline (Employee ID)
app.get('/rejected-tasks/:timeline', (req, res) => {
    const { timeline } = req.params;
    console.log(`Fetching rejected tasks for Timeline: ${timeline}`);

    const query = `SELECT * FROM rejected_tasks WHERE timeline = ?`;

    db.query(query, [timeline], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: '❌ Error retrieving rejected tasks', error: err.sqlMessage });
        }
        console.log("✅ Rejected tasks retrieved:", results);
        res.status(200).json(results);
    });
});

app.post('/submit-task/:taskId', (req, res) => {
    const taskId = req.params.taskId;
    const { assigned_to } = req.body;

    if (!taskId) {
        return res.status(400).json({ success: false, message: "❌ Missing task ID" });
    }

    console.log(`🔄 Submitting task with ID: ${taskId}`);

    // Fetch task details from rejected_tasks
    const fetchQuery = "SELECT * FROM rejected_tasks WHERE task_id = ?";
    db.query(fetchQuery, [taskId], (err, results) => {
        if (err) {
            console.error("❌ Database error while fetching task:", err);
            return res.status(500).json({ success: false, message: "Database error while fetching task." });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "❌ Task not found in rejected tasks." });
        }

        const task = results[0];

        // Insert into completed_tasks table
        const insertQuery = `
            INSERT INTO completed_tasks (name, number, accessories, problem_reported, timeline, assigned_to)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(insertQuery, [task.name, task.number, task.accessories, task.problem_reported, task.timeline, assigned_to], (err) => {
            if (err) {
                console.error("❌ Database error while inserting into completed_tasks:", err);
                return res.status(500).json({ success: false, message: "Database error while inserting completed task." });
            }

            // Delete from rejected_tasks after successfully adding to completed_tasks
            const deleteQuery = "DELETE FROM rejected_tasks WHERE task_id = ?";
            db.query(deleteQuery, [taskId], (err) => {
                if (err) {
                    console.error("❌ Error deleting task from rejected_tasks:", err);
                    return res.status(500).json({ success: false, message: "Task submitted but could not be removed from rejected tasks." });
                }

                console.log(`✅ Task ${taskId} moved to completed_tasks successfully!`);
                return res.json({ success: true, message: "✅ Task submitted and added to completed tasks!" });
            });
        });
    });
});

app.get('/approved-tasks', (req, res) => {
    const query = "SELECT * FROM approved_tasks";

    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Database error while fetching approved tasks:", err);
            return res.status(500).json({ message: "❌ Error retrieving approved tasks", error: err.sqlMessage });
        }

        console.log("✅ Approved tasks retrieved:", results);
        res.status(200).json(results);
    });
});

app.get("/tasks", (req, res) => {
    const sql = "SELECT id, name, number, accessories, problem_reported,timeline, assigned_to, created_at FROM task";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Error fetching tasks:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.json(results);
    });
});
app.delete('/delete-approved-task/:taskId', (req, res) => {
    const taskId = req.params.taskId;

    if (!taskId) {
        return res.status(400).json({ success: false, message: "❌ Missing task ID" });
    }   

    const deleteQuery = `DELETE FROM approved_tasks WHERE id = ?`;

    db.query(deleteQuery, [taskId], (err, result) => {
        if (err) {
            console.error("❌ Database error:", err);
            return res.status(500).json({ success: false, message: "❌ Error deleting task", error: err.sqlMessage });
        }

        if (result.affectedRows > 0) {
            res.status(200).json({ success: true, message: "✅ Task deleted successfully" });
        } else {
            res.status(404).json({ success: false, message: "❌ Task not found" });
        }
    });
});

// API to Fetch Tasks based on Dynamic Timeline
app.get("/tasks/:timeline", (req, res) => {
    const { timeline } = req.params; // Get timeline value from request URL
    const query = `
        SELECT id, name, number, accessories, problem_reported, 
               timeline, assigned_to, created_at
        FROM task
        WHERE timeline = ?;  -- Dynamically filter by timeline
    `;

    db.query(query, [timeline], (err, results) => {
        if (err) {
            console.error("❌ Error fetching tasks:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});



// ✅ Dynamic route to fetch rejected tasks for each employee
app.get("/rejected-tasks", (req, res) => {
    const query = `
        SELECT id, task_id, name, number, accessories, problem_reported, 
               timeline, assigned_to, rejection_note, rejected_at 
        FROM rejected_tasks 
        WHERE timeline = 1
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Error fetching rejected tasks:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});


// ✅ Fetch approved tasks for Employee 2
// app.get("/task/:employeeId", (req, res) => {
//     const { employeeId } = req.params; // Get employee ID from URL
//     const query = `
//         SELECT id, name, number, accessories, problem_reported, timeline, created_at 
//         FROM task
//         WHERE timeline = 2 
//     `;

//     db.query(query, [employeeId], (err, results) => {
//         if (err) {
//             console.error(`❌ Error fetching tasks for Employee ${employeeId}:`, err);
//             return res.status(500).json({ error: "Database error" });
//         }
//         res.json(results);
//     });
// });




// ✅ Dynamic route to fetch rejected tasks for each employee
app.get("/rejected-tasks/:employeeId", (req, res) => {
    const { employeeId } = req.params;
    const query = `
        SELECT id, task_id, name, number, accessories, problem_reported, 
               assigned_to, rejection_note, rejected_at 
        FROM rejected_tasks 
        WHERE assigned_to = ?
    `;

    db.query(query, [employeeId], (err, results) => {
        if (err) {
            console.error(`❌ Error fetching rejected tasks for Employee ${employeeId}:`, err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});


// API to Fetch Progress Data in Numbers (NOT percentages)
app.get("/progress", (req, res) => {
    const query = `
        SELECT 
            (SELECT COUNT(*) FROM task) AS total_tasks,
            (SELECT COUNT(*) FROM approved_tasks) AS approved_tasks,
            (SELECT COUNT(*) FROM rejected_tasks) AS rejected_tasks
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("❌ Error fetching data:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        // Extract data from the first row correctly
        const { total_tasks, approved_tasks, rejected_tasks } = results[0];

        const progress = {
            tasks: total_tasks || 0,
            approved: approved_tasks || 0,
            rejected: rejected_tasks || 0
        };

        res.json(progress);
    });
});





app.post("/approve-task/:taskId", async (req, res) => {
    const taskId = req.params.taskId;

    try {
        // Update the rejected task and move it to the completed_tasks table with assigned_to = 10
        await db.query(
            `INSERT INTO completed_tasks (id, name, problem_reported, status, assigned_to)
             SELECT id, name, problem_reported, 'approved', 10 FROM rejected_task WHERE id = ?`,
            [taskId]
        );

        // Delete from rejected_task after approval
        await db.query("DELETE FROM rejected_task WHERE id = ?", [taskId]);

        res.json({ success: true, message: "Task moved to completed_tasks with assigned_to = 10" });
    } catch (error) {
        console.error("❌ Error approving task:", error);
        res.status(500).json({ success: false, message: "Failed to approve task." });
    }
});

// API Endpoint to Fetch Task Progress
app.get("/graph", (req, res) => {
    let { days, month } = req.query;
    let sql = "";
    let values = [];

    if (days) {
        // Fetch data for last 'N' days using created_at
        sql = `SELECT DATE(created_at) AS date, COUNT(*) AS total_tasks 
               FROM task 
               WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) 
               GROUP BY DATE(created_at) ORDER BY date ASC`;
        values = [parseInt(days)];
    } else if (month) {
        // Fetch data for a specific month using created_at
        sql = `SELECT DATE(created_at) AS date, COUNT(*) AS total_tasks 
               FROM task 
               WHERE DATE_FORMAT(created_at, '%Y-%m') = ? 
               GROUP BY DATE(created_at) ORDER BY date ASC`;
        values = [month];
    } else {
        // Default to last 7 days
        sql = `SELECT DATE(created_at) AS date, COUNT(*) AS total_tasks 
               FROM task 
               WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
               GROUP BY DATE(created_at) ORDER BY date ASC`;
    }

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("❌ Database Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ tasks: result });
    });
});


app.post("/move-to-picked/:taskId", (req, res) => {
    const taskId = req.params.taskId;

    const moveSql = `
        INSERT INTO picked_tasks (name, number, accessories, problem_reported, timeline, created_at)
        SELECT name, number, accessories, problem_reported, timeline, created_at FROM approved_tasks WHERE id = ?;
    `;

    db.query(moveSql, [taskId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        // Delete from approved_tasks after moving
        const deleteSql = "DELETE FROM approved_tasks WHERE id = ?";
        db.query(deleteSql, [taskId], (deleteErr, deleteResult) => {
            if (deleteErr) return res.status(500).json({ success: false, message: deleteErr.message });

            res.json({ success: true, message: "Task moved to Picked Tasks!" });
        });
    });
});
// Add these at the top with your other requires
const fs = require('fs');


// Configure Excel file path
const EXCEL_FILE_PATH = path.join(__dirname, 'task_export.xlsx');

// Function to ensure Excel file exists with proper structure
async function ensureExcelFile() {
    try {
        const workbook = new ExcelJS.Workbook();
        
        // If file doesn't exist, create it with headers
        if (!fs.existsSync(EXCEL_FILE_PATH)) {
            const worksheet = workbook.addWorksheet('Picked Tasks');
            
            // Define columns
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Name', key: 'name', width: 20 },
                { header: 'Number', key: 'number', width: 15 },
                { header: 'Accessories', key: 'accessories', width: 25 },
                { header: 'Problem Reported', key: 'problem_reported', width: 30 },
                { header: 'Timeline', key: 'timeline', width: 15 },
                { header: 'Created At', key: 'created_at', width: 20 }
            ];
            
            await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
            console.log('✅ Created new Excel file with headers');
        }
    } catch (error) {
        console.error('❌ Error ensuring Excel file:', error);
        throw error;
    }
}

// Function to export data to Excel
async function exportToExcel() {
    try {
        await ensureExcelFile();
        
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(EXCEL_FILE_PATH);
        
        let worksheet = workbook.getWorksheet('Picked Tasks');
        if (!worksheet) {
            worksheet = workbook.addWorksheet('Picked Tasks');
        }

        // Clear existing data (except headers)
        if (worksheet.rowCount > 1) {
            worksheet.spliceRows(2, worksheet.rowCount);
        }

        // Get data from database
        const [tasks] = await db.promise().query('SELECT * FROM picked_tasks');
        
        if (!tasks || tasks.length === 0) {
            console.log('⚠️ No data found in picked_tasks table');
            return { success: false, message: 'No data to export' };
        }

        // Add data rows
        tasks.forEach(task => {
            worksheet.addRow({
                id: task.id,
                name: task.name,
                number: task.number,
                accessories: task.accessories,
                problem_reported: task.problem_reported,
                timeline: task.timeline,
                created_at: task.created_at
            });
        });

        // Save the file
        await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
        console.log(`✅ Exported ${tasks.length} records to Excel`);
        
        return { success: true, count: tasks.length };
    } catch (error) {
        console.error('❌ Export failed:', error);
        throw error;
    }
}

// API endpoint to trigger export
app.get('/export-excel', async (req, res) => {
    try {
        const result = await exportToExcel();
        
        if (result.success) {
            // Send the file as download
            res.download(EXCEL_FILE_PATH, 'picked_tasks_export.xlsx', (err) => {
                if (err) {
                    console.error('Download error:', err);
                    res.status(500).json({ error: 'Failed to download file' });
                }
            });
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        res.status(500).json({ 
            error: 'Export failed',
            details: error.message 
        });
    }
});

// Initialize when server starts
ensureExcelFile().catch(console.error);

// ✅ New route for updating only timeline
app.post('/update-timeline', (req, res) => {
    const { task_id, timeline } = req.body;

    if (!task_id || !timeline) {
        return res.status(400).json({ error: 'Missing task_id or timeline' });
    }

    const sql = 'UPDATE task SET timeline = ? WHERE id = ?';
    db.query(sql, [timeline, task_id], (err, result) => {
        if (err) {
            console.error('❌ SQL error:', err.message);
            return res.status(500).json({ error: 'SQL error occurred' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.json({ message: '✅ Timeline updated successfully' });
    });
});




app.post('/save-task', (req, res) => {
    const { name, number, accessories, problem_reported, timeline, assigned_to } = req.body;

    if (!name || !number || !accessories || !problem_reported || !timeline || !assigned_to) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
        INSERT INTO task (name, number, accessories, problem_reported, timeline, assigned_to)
        VALUES (?, ?, ?, ?, ?, NULL)
    `;

    db.query(query, [name, number, accessories, problem_reported, timeline, assigned_to], (err, result) => {
        if (err) {
            console.error('❌ Error saving task:', err);
            return res.status(500).json({ error: 'Failed to save task' });
        }
        res.status(200).json({ message: '✅ Task saved to task table', insertId: result.insertId });
    });
});



app.post('/update-task/:id', (req, res) => {
    const taskId = req.params.id;
    const { status, response } = req.body;

    const sql = "UPDATE task SET status = ?, response = ? WHERE id = ?";
    db.query(sql, [status, response, taskId], (err, result) => {
        if (err) {
            console.error("❌ Update failed:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json({ success: true });
    });
});

// Helper function to hash passwords
// Password hashing function
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Check MySQL connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection error:', err);
    } else {
        console.log('✅ Database connected!');
        connection.release();
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing username or password' });
    }
    
    const hashedPassword = hashPassword(password);
    
    try {
        const [rows] = await db.promise().query(
            `SELECT id, username, role, full_name, is_active 
             FROM auth_users 
             WHERE username = ? AND password = ? AND is_active = TRUE`,
            [username, hashedPassword]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const user = rows[0];
        
        // Update last login timestamp
        await db.promise().query(
            'UPDATE auth_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );
        
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                full_name: user.full_name
            },
            role: user.role
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error occurred' });
    }
});


// Get all users (for admin purposes)
app.get('/users', async (req, res) => {
    try {
        const [users] = await pool.execute(
            `SELECT id, username, role, full_name, created_at, last_login, is_active 
             FROM auth_users 
             ORDER BY role, username`
        );
        
        res.json({
            users: users,
            total: users.length
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error occurred' });
    }
});

// Change password endpoint
app.post('/change-password', async (req, res) => {
    const { username, old_password, new_password } = req.body;
    
    if (!username || !old_password || !new_password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const hashedOldPassword = hashPassword(old_password);
    const hashedNewPassword = hashPassword(new_password);
    
    try {
        // Verify old password
        const [rows] = await pool.execute(
            'SELECT id FROM auth_users WHERE username = ? AND password = ?',
            [username, hashedOldPassword]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid current password' });
        }
        
        // Update password
        await pool.execute(
            'UPDATE auth_users SET password = ? WHERE username = ?',
            [hashedNewPassword, username]
        );
        
        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error occurred' });
    }
});

// Toggle user status (admin only)
app.post('/toggle-user-status', async (req, res) => {
    const { username, is_active } = req.body;
    
    if (!username || typeof is_active !== 'boolean') {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    try {
        const [result] = await pool.execute(
            'UPDATE auth_users SET is_active = ? WHERE username = ?',
            [is_active, username]
        );
        
        const status = is_active ? 'activated' : 'deactivated';
        res.json({ message: `User ${username} ${status} successfully` });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error occurred' });
    }
});

// Serve the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// // Start server
// app.listen(PORT, '127.0.0.1', async () => {
//     console.log(`Server running on http://127.0.0.1:${PORT}`);
    
//     // Test database connection
//     try {
//         const connection = await pool.getConnection();
//         console.log('Successfully connected to MySQL database');
//         connection.release();
//     } catch (err) {
//         console.error('Database connection failed:', err);
//         process.exit(1);
//     }
// });

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    pool.end().then(() => process.exit(0));
});

process.on('SIGTERM', () => {
    console.log('\nShutting down server...');
    pool.end().then(() => process.exit(0));
});
// Start Server
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});