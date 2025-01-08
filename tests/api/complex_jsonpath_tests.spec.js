const { test, expect } = require('@playwright/test');
const jsonpath = require('jsonpath');
const testData = require('../../data/api/complex_json_payload.json');

test.describe('Complex JSONPath Examples', () => {

    test('complex negative conditions and multiple filters', async () => {
        // Find employees not in senior level and not working on any critical projects
        const employees = jsonpath.query(testData, "$.departments[*].teams[*].employees[?(@.level != 'senior')]");
        const nonSeniorNonCritical = employees.filter(emp => {
          const empProjects = jsonpath.query(testData, `$..projects[?(@.id in ${JSON.stringify(emp.projects)})]`);
          return !empProjects.some(proj => proj.tags.includes('critical'));
        });
        
        expect(nonSeniorNonCritical).toHaveLength(2); // Alice and Eve
        nonSeniorNonCritical.forEach(emp => {
          expect(emp.level).not.toBe('senior');
        });
    
          // Find all teams that have no completed projects but have senior employees
          const allTeams = jsonpath.query(testData, "$.departments[*].teams[*]");
          const teamsWithSeniorNoComplete = allTeams.filter(team => {
          const hasCompletedProjects = team.projects.some(p => p.status === 'completed');
          const hasSeniorEmployees = team.employees.some(e => e.level === 'senior');
          return !hasCompletedProjects && hasSeniorEmployees;
        });
        expect(teamsWithSeniorNoComplete).toHaveLength(1); // Frontend team
    });
    
      test('filtering based on subarray conditions', async () => {
        // Find departments that have teams with both frontend and backend skills
        const departments = jsonpath.query(testData, "$.departments[*]");
        const fullStackDepts = departments.filter(dept => {
          const allSkills = dept.teams.flatMap(team => 
            team.employees.flatMap(emp => emp.skills)
          );
          return allSkills.includes('JavaScript') && allSkills.includes('Python');
        });
        
        expect(fullStackDepts).toHaveLength(1);
        expect(fullStackDepts[0].name).toBe('Engineering');
    
        // Find teams where all employees are working on the same project
        const teams = jsonpath.query(testData, "$.departments[*].teams[*]");
        const commonProjectTeams = teams.filter(team => {
          if (team.employees.length === 0) return false;
          const firstProject = team.employees[0].projects[0];
          return team.employees.every(emp => 
            emp.projects.includes(firstProject)
          );
        });
        expect(commonProjectTeams.some(team => team.name === 'Digital')).toBeTruthy();
    });

  test('complex array manipulations and nested conditions', async () => {
    // Find projects that have all senior developers and are active
    const activeProjects = jsonpath.query(testData, "$.departments[*].teams[*].projects[?(@.status == 'active')]");
    const seniorActiveProjects = activeProjects.filter(project => {
      // Get all employees first, then filter for those working on this project
      const allEmployees = jsonpath.query(testData, "$..employees");
      const projectEmployees = allEmployees.flat().filter(emp => 
        emp.projects.includes(project.id)
      );
      return projectEmployees.every(emp => emp.level === 'senior');
    });
    
    seniorActiveProjects.forEach(project => {
      expect(project.status).toBe('active');
    });

    // Find teams with more than one project having specific tags
    const teams = jsonpath.query(testData, "$.departments[*].teams[*]");
    const multiTaggedTeams = teams.filter(team => {
      const taggedProjects = team.projects.filter(p => 
        p.tags.includes('critical') || p.tags.includes('web')
      );
      return taggedProjects.length > 1;
    });
    
    multiTaggedTeams.forEach(team => {
      const criticalOrWebProjects = team.projects.filter(p => 
        p.tags.includes('critical') || p.tags.includes('web')
      );
      expect(criticalOrWebProjects.length).toBeGreaterThan(1);
    });
  });

  test('combining multiple complex conditions', async () => {
    // Find departments with high budget AND teams with specific skill combinations
    const departments = jsonpath.query(testData, "$.departments[?(@.budget > 750000)]");
    const complexDeptQuery = departments.filter(dept => {
      // Get all employees and check their skills
      const employees = jsonpath.query(dept, "$..employees");
      const hasJavaScript = employees.flat().some(emp => 
        emp.skills.includes('JavaScript')
      );
      
      const hasActiveProjects = jsonpath.query(dept, "$..projects[?(@.status == 'active')]").length > 0;
      return hasJavaScript && hasActiveProjects;
    });
    
    expect(complexDeptQuery).toHaveLength(1);
    expect(complexDeptQuery[0].name).toBe('Engineering');

    // Find employees working on multiple projects with specific conditions
    const seniorEmployees = jsonpath.query(testData, "$..employees[?(@.level == 'senior')]");
    const complexEmployeeQuery = seniorEmployees.filter(emp => {
      if (emp.projects.length <= 1) return false;
      
      // Get all projects and filter for this employee's projects
      const allProjects = jsonpath.query(testData, "$..projects");
      const empProjects = allProjects.flat().filter(p => 
        emp.projects.includes(p.id)
      );
      return empProjects.every(p => p.priority < 3);
    });
    
    complexEmployeeQuery.forEach(employee => {
      expect(employee.projects.length).toBeGreaterThan(1);
      expect(employee.level).toBe('senior');
    });
  });
});