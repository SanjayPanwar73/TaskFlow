import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import getApiError from '../utils/getApiError';

const PROJECTS_PAGE_SIZE = 8;

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-600/50 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
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

function ProjectCard({ project, isAdmin, onAddMember, onRemoveMember, onDelete }) {
  return (
    <div className="card hover:border-slate-600 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">{project.name}</h3>
          {project.description && (
            <p className="text-slate-400 text-sm mt-1 line-clamp-2">{project.description}</p>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={() => onDelete(project._id)}
            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
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
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
          Members ({project.members?.length || 0})
        </p>
        <div className="flex flex-wrap gap-2">
          {project.members?.map((member) => {
            const isCreator = member._id === project.createdBy?._id;

            return (
              <div
                key={member._id}
                className="flex items-center gap-1.5 bg-slate-700/50 rounded-full px-3 py-1"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white font-bold">
                  {member.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-slate-300">
                  {member.name}
                  {isCreator ? ' (Owner)' : ''}
                </span>
                {isAdmin && !isCreator && (
                  <button
                    onClick={() => onRemoveMember(project._id, member._id)}
                    className="text-slate-500 hover:text-red-400 ml-0.5 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
          {isAdmin && (
            <button
              onClick={() => onAddMember(project)}
              className="flex items-center gap-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400
                         rounded-full px-3 py-1 text-xs transition-colors border border-indigo-500/30"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
        <span className="text-xs text-slate-500">Created by {project.createdBy?.name}</span>
        <span className="text-xs text-slate-500">
          {new Date(project.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

export default function Projects() {
  const { isAdmin } = useAuth();

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [addMemberModal, setAddMemberModal] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [form, setForm] = useState({ name: '', description: '', memberIds: [] });

  const fetchProjects = async (targetPage = page, showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const { data } = await api.get('/projects', {
        params: { page: targetPage, limit: PROJECTS_PAGE_SIZE },
      });

      setProjects(data.projects);
      setMeta(data.meta);
    } catch (error) {
      toast.error(getApiError(error, 'Failed to load projects.'));
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users', {
        params: { page: 1, limit: 100 },
      });

      setUsers(data.users);
    } catch (error) {
      toast.error(getApiError(error, 'Failed to load users.'));
    }
  };

  useEffect(() => {
    fetchProjects(page);
  }, [page]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [isAdmin]);

  const handleCreate = async (event) => {
    event.preventDefault();

    try {
      await api.post('/projects', form);
      setForm({ name: '', description: '', memberIds: [] });
      setShowCreate(false);
      toast.success('Project created.');

      if (page !== 1) {
        setPage(1);
      } else {
        fetchProjects(1, false);
      }
    } catch (error) {
      toast.error(getApiError(error, 'Failed to create project.'));
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error('Select a user first.');
      return;
    }

    try {
      const { data } = await api.post(`/projects/${addMemberModal._id}/members`, {
        userId: selectedUserId,
      });

      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project._id === data.project._id ? data.project : project
        )
      );
      setSelectedUserId('');
      setAddMemberModal(null);
      toast.success('Member added.');
    } catch (error) {
      toast.error(getApiError(error, 'Failed to add member.'));
    }
  };

  const handleRemoveMember = async (projectId, userId) => {
    try {
      const { data } = await api.delete(`/projects/${projectId}/members/${userId}`);

      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project._id === data.project._id ? data.project : project
        )
      );
      toast.success('Member removed.');
    } catch (error) {
      toast.error(getApiError(error, 'Failed to remove member.'));
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Delete this project and all of its tasks?')) {
      return;
    }

    try {
      await api.delete(`/projects/${projectId}`);
      toast.success('Project deleted.');

      if (projects.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        fetchProjects(page, false);
      }
    } catch (error) {
      toast.error(getApiError(error, 'Failed to delete project.'));
    }
  };

  const availableUsers = addMemberModal
    ? users.filter(
        (user) => !addMemberModal.members?.some((member) => member._id === user._id)
      )
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {meta?.total ?? projects.length} project{(meta?.total ?? projects.length) !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>
          <p className="text-slate-400 mb-2">No projects yet</p>
          {isAdmin && (
            <button onClick={() => setShowCreate(true)} className="text-indigo-400 hover:underline text-sm">
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              isAdmin={isAdmin}
              onAddMember={(selectedProject) => {
                setSelectedUserId('');
                setAddMemberModal(selectedProject);
              }}
              onRemoveMember={handleRemoveMember}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Pagination meta={meta} onPageChange={setPage} />

      {showCreate && (
        <Modal title="Create New Project" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Project Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="e.g. Website Redesign"
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="What is this project about?"
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Add Members</label>
              <select
                multiple
                value={form.memberIds}
                onChange={(event) =>
                  setForm({
                    ...form,
                    memberIds: [...event.target.selectedOptions].map((option) => option.value),
                  })
                }
                className="input-field h-28"
              >
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1">
                Create Project
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {addMemberModal && (
        <Modal title={`Add Member to "${addMemberModal.name}"`} onClose={() => setAddMemberModal(null)}>
          <div className="space-y-4">
            {availableUsers.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">All users are already members.</p>
            ) : (
              <>
                <select
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  className="input-field"
                >
                  <option value="">Select a user...</option>
                  {availableUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <button onClick={handleAddMember} className="btn-primary flex-1">
                    Add Member
                  </button>
                  <button onClick={() => setAddMemberModal(null)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
