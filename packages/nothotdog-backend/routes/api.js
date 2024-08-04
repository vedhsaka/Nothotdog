const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const projectController = require('../controllers/projectController');
const inputController = require('../controllers/inputController');
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/users', userController.createUser);
router.get('/user', userController.getUser);
router.put('/users', userController.updateUser);
// router.delete('/delete-user', userController.deleteUser);

router.post('/projects', projectController.createProject);
router.get('/projects', projectController.getProjects);
router.post('/add-user-to-project', projectController.addUserToProject);
router.post('/remove-user-from-project', projectController.removeUserFromProject);
// router.delete('/delete-project/:projectId', projectController.deleteProject);

router.post('/groups', groupController.createGroup);
router.get('/groups/:project_id', groupController.getGroups);
// router.put('/groups/:id', groupController.updateGroup);

router.post('/inputs', inputController.saveInput); // Note the correction here
router.get('/inputs', inputController.getInputs);
router.delete('/inputs/:uuid', inputController.deleteInput);
router.post('/test-inputs', inputController.testInput);





module.exports = router;