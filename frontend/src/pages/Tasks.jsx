import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import getApiError from '../utils/getApiError';

const TASKS_PAGE_SIZE = 10;
const STATUSES = ['Pending', 'In Progress', 'Completed'];
const EMPTY_FORM = {
  title: '',
  description: '',
  projectId: '',
  assignedTo: '',
  status: 'Pending',
  dueDate: '',
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-600/50 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 sticky top-0 bg-slate-800 z-10">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const { isAdmin } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState(null);
  const [projectOptions, setProjectOptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProject, setFilterProject] = useState('');

  const selectedProject = projectOptions.find((project) => project._id === form.projectId);
  const assignableUsers = !isAdmin
    ? []
    : !selectedProject
      ? users
      : users.filter((user) =>
          selectedProject.members?.some((member) => member._id === user._id)
        );

  const fetchReferenceData = async () => {
    try {
      const requests = [
        api.get('/projects', {
          params: { page: 1, limit: 100 },
        }),
      ];

      if (isAdmin) {
        requests.push(
          api.get('/users', {
            params: { page: 1, limit: 100 },
          })
        );
      }

      const [projectsResponse, usersResponse] = await Promise.all(requests);
      setProjectOptions(projectsResponse.data.projects);
      setUsers(usersResponse?.data.users || []);
    } catch (error) {
      toast.error(getApiError(error, 'Failed to load reference data.'));
    }
  };

  const fetchTasks = async (targetPage = page, showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const { data } = await api.get('/tasks', {
        params: {
          page: targetPage,
          limit: TASKS_PAGE_SIZE,
          status: filterStatus || undefined,
          projectId: filterProject || undefined,
        },
      });

      setTasks(data.tasks);
      setMeta(data.meta);
    } catch (error) {
      toast.error(getApiError(error, 'Failed to load tasks.'));
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchReferenceData();
  }, [isAdmin]);

  useEffect(() => {
    fetchTasks(page);
  }, [page, filterStatus, filterProject]);

  const openCreate = () => {
    setEditingTask(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      projectId: task.project?._id || '',
      assignedTo: task.assignedTo?._id || '',
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleProjectChange = (projectId) => {
    const project = projectOptions.find((item) => item._id === projectId);
    const isAssignedUserStillValid = project?.members?.some(
      (member) => member._id === form.assignedTo
    );

    setForm((currentForm) => ({
      ...currentForm,
      projectId,
      assignedTo: isAssignedUserStillValid ? currentForm.assignedTo : '',
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      title: form.title,
      description: form.description,
      projectId: form.projectId,
      assignedTo: form.assignedTo || null,
      status: form.status,
      dueDate: form.dueDate || null,
    };

    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, payload);
        toast.success('Task updated.');
        fetchTasks(page, false);
      } else {
        await api.post('/tasks', payload);
        toast.success('Task created.');

        if (page !== 1) {
          setPage(1);
        } else {
          fetchTasks(1, false);
        }
      }

      setShowModal(false);
    } catch (error) {
      toast.error(getApiError(error, 'Failed to save task.'));
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) {
      return;
    }

    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted.');

      if (tasks.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        fetchTasks(page, false);
      }
    } catch (error) {
      toast.error(getApiError(error, 'Failed to delete task.'));
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks((currentTasks) =>
        currentTasks.map((task) => (task._id === taskId ? data.task : task))
      );
      toast.success('Status updated.');
    } catch (error) {
      toast.error(getApiError(error, 'Failed to update status.'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {meta?.total ?? tasks.length} task{(meta?.total ?? tasks.length) !== 1 ? 's' : ''}
            {!isAdmin && ' assigned to you'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 w-fit">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(event) => {
            setFilterStatus(event.target.value);
            setPage(1);
          }}
          className="bg-slate-800 border border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          value={filterProject}
          onChange={(event) => {
            setFilterProject(event.target.value);
            setPage(1);
          }}
          className="bg-slate-800 border border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Projects</option>
          {projectOptions.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </select>
        {(filterStatus || filterProject) && (
          <button
            onClick={() => {
              setFilterStatus('');
              setFilterProject('');
              setPage(1);
            }}
            className="text-sm text-slate-400 hover:text-slate-200 px-3 py-2 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        {tasks.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"
                />
              </svg>
            </div>
            <p className="text-slate-400">No tasks found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/50">
                  <th className="text-left text-slate-400 font-medium px-6 py-3">Task</th>
                  <th className="text-left text-slate-400 font-medium py-3 hidden sm:table-cell">Project</th>
                  <th className="text-left text-slate-400 font-medium py-3 hidden md:table-cell">Assigned To</th>
                  <th className="text-left text-slate-400 font-medium py-3 hidden lg:table-cell">Due Date</th>
                  <th className="text-left text-slate-400 font-medium py-3">Status</th>
                  {isAdmin && <th className="py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {tasks.map((task) => {
                  const isOverdue =
                    task.dueDate &&
                    task.status !== 'Completed' &&
                    new Date(task.dueDate) < new Date();

                  return (
                    <tr key={task._id} className="hover:bg-slate-700/20 transition-colors group">
                      <td className="py-3 px-6 pr-4">
                        <div>
                          <p className="font-medium text-slate-200">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-400 text-sm hidden sm:table-cell">
                        {task.project?.name || '-'}
                      </td>
                      <td className="py-3 pr-4 hidden md:table-cell">
                        {task.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white font-bold">
                              {task.assignedTo.name?.charAt(0)}
                            </div>
                            <span className="text-sm text-slate-300">{task.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 hidden lg:table-cell">
                        {task.dueDate ? (
                          <span className={`text-sm ${isOverdue ? 'text-red-400 font-medium' : 'text-slate-400'}`}>
                            {isOverdue && 'Warning '}
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-sm">-</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {isAdmin ? (
                          <StatusBadge status={task.status} />
                        ) : (
                          <select
                            value={task.status}
                            onChange={(event) => handleStatusChange(task._id, event.target.value)}
                            className="bg-slate-700 border border-slate-600 text-slate-200 text-xs rounded-lg px-2 py-1
                                       focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="py-3 pr-6">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEdit(task)}
                              className="text-slate-400 hover:text-indigo-400 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(task._id)}
                              className="text-slate-400 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination meta={meta} onPageChange={setPage} />

      {showModal && (
        <Modal title={editingTask ? 'Edit Task' : 'Create New Task'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="e.g. Design landing page"
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Task details..."
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Project *</label>
              <select
                value={form.projectId}
                onChange={(event) => handleProjectChange(event.target.value)}
                required
                className="input-field"
              >
                <option value="">Select a project...</option>
                {projectOptions.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Assign To</label>
              <select
                value={form.assignedTo}
                onChange={(event) => setForm({ ...form, assignedTo: event.target.value })}
                className="input-field"
                disabled={!form.projectId}
              >
                <option value="">Unassigned</option>
                {assignableUsers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                  className="input-field"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                  className="input-field"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1">
                {editingTask ? 'Save Changes' : 'Create Task'}
              </button>
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
