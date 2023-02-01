const inquirer = require('inquirer');
const mysql = require('mysql2');
const fs = require("fs");
require('dotenv').config();

const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.DB_PASSWORD,
    database: 'employee_db'
  });
  
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

const promptUser = () => {
  inquirer.prompt ([
    {
      type: 'list',
      name: 'choices', 
      message: 'What would you like to do?',
      choices: ['View departments', 
                'View roles', 
                'View employees', 
                'Add department', 
                'Add role', 
                'Add employee', 
                'Update employee role',
                'Update employee manager',
                "View employees by department",
                'Delete department',
                'Delete role',
                'Delete employee',
                'View department budgets']
    }
  ]).then(function(val) {
    switch (val.choices) {
      case "View departments":
        viewDepartments();
          break;
        case "View roles":
          viewRoles();
          break;
        case 'Add department':
          addDepartment();
          break;
        case 'Add role':
          addRole();
          break;
        case 'Add employee':
          addEmployee();
          break;
        case 'Update employee role':
          updateRole();
          break;
        case 'Update employee manager':
          updateManager();
          break;
        case 'View employees by department':
          viewByDepartment();
          break;
        case 'Delete department':
          deleteDepartment();
          break;
        case 'View department budgets':
          viewBudgets();
          break;
    };
  })
};

const viewDepartments = () => {
  console.log('Showing all departments...\n');
  const sql = `SELECT department.id AS id, department.name AS department FROM department`; 

  con.promise().query(sql)
    .then(([rows]) => {
    console.table(rows);
    promptUser();
  })
  .catch(err => console.error(err));
};

const viewRoles = () => {
  console.log('Showing all roles...\n');

  const sql = `SELECT role.id, role.title, department.name AS department
               FROM role
               INNER JOIN department ON role.department_id = department.id`;
  
  con.promise().query(sql)
  .then(([rows]) => {
    let departments = rows
    console.table(departments)
  })
  .then(() => promptUser())
  .catch(err => console.error(err))
};

const addDepartment = () => {
  inquirer.prompt([
    {
      type: 'input', 
      name: 'addDept',
      message: "What department do you want to add?",
      validate: addDept => {
        if (addDept) {
            return true;
        } else {
            console.log('Please enter a department');
            return false;
        }
      }
    }
  ])
    .then(answer => {
      const sql = `INSERT INTO department (name)
                  VALUES (?)`;
      con.query(sql, answer.addDept, (err, result) => {
        if (err) throw err;
        console.log('Added ' + answer.addDept + " to departments!"); 

        viewDepartments();
    });
  });
};

const addEmployee = () => {
   inquirer.prompt([
    {
      type:'input',
      name: "first",
      message: "what is the first name of the employee?",
      validate: answer =>{
        if(answer !== ''){
          return true;
        }
        {
          return"Employee's first name must conaint at least one character"
        }
      }
    },
    {
      type:'input',
      name: "last",
      message: "what is the last name of the employee?",
      validate: answer =>{
        if(answer !== ''){
          return true;
        }
        {
          return"Employee's first name must conaint at least one character"
        }
      }
    },
    {
      type:'input',
      name:'role id',
      message: 'what is the role id of for this employee',
      validate: answer =>{
        if (isNan(answer) === false){
          return true;
        }
        return false;
      }
    },
    {
      type:'input',
      name:'manager id',
      message: 'what is the manager id for this employee',
      validate: answer =>{
        if (isNan(answer) === false){
          return true;
        }
        return false;
      }
    }
  ])
  .then(function(answer) {
    con.query("INSERT INTO employee SET ?",
        {first_name: answer.first_name,
          last_name: answer.last_name,
          role_id: answer.role_id || 0,
          manager_id: answer.manager_id || 0},
        function(err) {
          if (err) throw err;
          console.log("Employyee has been added!");
          run();
        });
      });
}
const addRole = () => {
  inquirer.prompt([
    {
      type: 'input', 
      name: 'role',
      message: "What role do you want to add?",
      validate: addRole => {
        if (addRole) {
            return true;
        } else {
            console.log('Please enter a role');
            return false;
        }
      }
    },
    {
      type: 'input', 
      name: 'salary',
      message: "What is the salary of this role?",
      validate: addSalary => {
        if (typeof addSalary === 'string') {
            return true;
        } else {
            console.log('\nPlease enter a salary');
            return false;
        }
      }
    }
  ])
    .then(answer => {
      const params = [answer.role, answer.salary];

      const roleSql = `SELECT name, id FROM department`; 

      con.promise().query(roleSql)
        .then(data => {
        const dept = data[0].map(({ name, id }) => ({ name: name, value: id }));

        inquirer.prompt([
        {
          type: 'list', 
          name: 'dept',
          message: "What department is this role in?",
          choices: dept
        }
        ])
          .then(deptChoice => {
            const dept = deptChoice.dept;
            params.push(dept);

            const sql = `INSERT INTO role (title, salary, department_id)
                        VALUES (?, ?, ?)`;

            con.query(sql, params, (err, result) => {
              if (err) throw err;
              console.log('Added' + answer.role + " to roles!"); 

              viewRoles();
       });
     });
   });
 });
};

const updateEmployee = () => {
  const employeeSql = `SELECT * FROM employee`;

  con.promise().query(employeeSql, (err, data) => {
    if (err) throw err; 

  const employees = data.map(({ id, first_name, last_name }) => ({ name: first_name + " "+ last_name, value: id }));

    inquirer.prompt([
      {
        type: 'list',
        name: 'name',
        message: "Which employee would you like to update?",
        choices: employees
      }
    ])
      .then(empChoice => {
        const employee = empChoice.name;
        const params = []; 
        params.push(employee);

        const roleSql = `SELECT * FROM role`;

        con.promise().query(roleSql, (err, data) => {
          if (err) throw err; 

          const roles = data.map(({ id, title }) => ({ name: title, value: id }));
          
            inquirer.prompt([
              {
                type: 'list',
                name: 'role',
                message: "What is the employee's new role?",
                choices: roles
              }
            ])
                .then(roleChoice => {
                const role = roleChoice.role;
                params.push(role); 
                
                let employee = params[0]
                params[0] = role
                params[1] = employee 

                const sql = `UPDATE employee SET role_id = ? WHERE id = ?`;

                con.query(sql, params, (err, result) => {
                  if (err) throw err;
                console.log("Employee has been updated!");
              
                showEmployees();
          });
        });
      });
    });
  });
};

const updateManager = () => {
  const employeeSql = `SELECT * FROM employee`;

  con.promise().query(employeeSql, (err, data) => {
    if (err) throw err; 

  const employees = data.map(({ id, first_name, last_name }) => ({ name: first_name + " "+ last_name, value: id }));

    inquirer.prompt([
      {
        type: 'list',
        name: 'name',
        message: "Which employee would you like to update?",
        choices: employees
      }
    ])
      .then(empChoice => {
        const employee = empChoice.name;
        const params = []; 
        params.push(employee);

        const managerSql = `SELECT * FROM employee`;

          con.promise().query(managerSql, (err, data) => {
            if (err) throw err; 

          const managers = data.map(({ id, first_name, last_name }) => ({ name: first_name + " "+ last_name, value: id }));
            
              inquirer.prompt([
                {
                  type: 'list',
                  name: 'manager',
                  message: "Who is the employee's manager?",
                  choices: managers
                }
              ])
                  .then(managerChoice => {
                    const manager = managerChoice.manager;
                    params.push(manager); 
                    
                    let employee = params[0]
                    params[0] = manager
                    params[1] = employee 
                    
                    const sql = `UPDATE employee SET manager_id = ? WHERE id = ?`;

                    con.query(sql, params, (err, result) => {
                      if (err) throw err;
                    console.log("Employee has been updated!");
                  
                    showEmployees();
          });
        });
      });
    });
  });
};

const employeeDepartment = () => {
  console.log('Showing employee by departments...\n');
  const sql = `SELECT employee.first_name, 
                      employee.last_name, 
                      department.name AS department
               FROM employee 
               LEFT JOIN role ON employee.role_id = role.id 
               LEFT JOIN department ON role.department_id = department.id`;

  con.promise().query(sql, (err, rows) => {
    if (err) throw err; 
    console.table(rows); 
    promptUser();
  });          
};

const deleteDepartment = () => {
  const deptSql = `SELECT * FROM department`; 

  con.promise().query(deptSql, (err, data) => {
    if (err) throw err; 

    const dept = data.map(({ name, id }) => ({ name: name, value: id }));

    inquirer.prompt([
      {
        type: 'list', 
        name: 'dept',
        message: "What department do you want to delete?",
        choices: dept
      }
    ])
      .then(deptChoice => {
        const dept = deptChoice.dept;
        const sql = `DELETE FROM department WHERE id = ?`;

        con.query(sql, dept, (err, result) => {
          if (err) throw err;
          console.log("Successfully deleted!"); 

        showDepartments();
      });
    });
  });
};

const deleteRole = () => {
  const roleSql = `SELECT * FROM role`; 

  con.promise().query(roleSql, (err, data) => {
    if (err) throw err; 

    const role = data.map(({ title, id }) => ({ name: title, value: id }));

    inquirer.prompt([
      {
        type: 'list', 
        name: 'role',
        message: "What role do you want to delete?",
        choices: role
      }
    ])
      .then(roleChoice => {
        const role = roleChoice.role;
        const sql = `DELETE FROM role WHERE id = ?`;

        con.query(sql, role, (err, result) => {
          if (err) throw err;
          console.log("Successfully deleted!"); 

          showRoles();
      });
    });
  });
};

const deleteEmployee = () => {
  const employeeSql = `SELECT * FROM employee`;

  con.promise().query(employeeSql, (err, data) => {
    if (err) throw err; 

  const employees = data.map(({ id, first_name, last_name }) => ({ name: first_name + " "+ last_name, value: id }));

    inquirer.prompt([
      {
        type: 'list',
        name: 'name',
        message: "Which employee would you like to delete?",
        choices: employees
      }
    ])
      .then(empChoice => {
        const employee = empChoice.name;

        const sql = `DELETE FROM employee WHERE id = ?`;

        con.query(sql, employee, (err, result) => {
          if (err) throw err;
          console.log("Successfully Deleted!");
        
          showEmployees();
    });
  });
 });
};

 const viewBudget = () => {
  console.log('Showing budget by department...\n');

  const sql = `SELECT department_id AS id, 
                      department.name AS department,
                      SUM(salary) AS budget
               FROM  role  
               JOIN department ON role.department_id = department.id GROUP BY  department_id`;
  
  con.promise().query(sql, (err, rows) => {
    if (err) throw err; 
    console.table(rows);

  });
};
  
promptUser(); 