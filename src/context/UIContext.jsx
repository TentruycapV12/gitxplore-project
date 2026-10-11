import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

/**
 * UIContext = Context API + useReducer.
 * Quản lý trạng thái modal (auth, support, playground, repo battle compare)
 * và dự án đang xem chi tiết.
 */

const UIContext = createContext(null);

const initialState = {
  modalType: null,
  selectedProject: null,
  compareProjects: null,
  playgroundTemplate: null,
};

function uiReducer(state, action) {
  switch (action.type) {
    case 'OPEN_MODAL':
      return { ...state, modalType: action.payload };
    case 'CLOSE_MODAL':
      return { ...state, modalType: null, compareProjects: null, playgroundTemplate: null };
    case 'SELECT_PROJECT':
      return { ...state, selectedProject: action.payload };
    case 'CLOSE_PROJECT':
      return { ...state, selectedProject: null };
    case 'OPEN_COMPARE':
      return { ...state, modalType: 'compare', compareProjects: action.payload || null };
    case 'OPEN_PLAYGROUND':
      return { ...state, modalType: 'playground', playgroundTemplate: action.payload || null };
    default:
      return state;
  }
}

export function UIProvider({ children }) {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  const openModal = useCallback((type) => dispatch({ type: 'OPEN_MODAL', payload: type }), []);
  const closeModal = useCallback(() => dispatch({ type: 'CLOSE_MODAL' }), []);
  const selectProject = useCallback(
    (project) => dispatch({ type: 'SELECT_PROJECT', payload: project }),
    []
  );
  const closeProject = useCallback(() => dispatch({ type: 'CLOSE_PROJECT' }), []);

  const openCompare = useCallback((pair) => dispatch({ type: 'OPEN_COMPARE', payload: pair }), []);
  const openPlayground = useCallback((templateId) => dispatch({ type: 'OPEN_PLAYGROUND', payload: templateId }), []);

  const value = useMemo(
    () => ({
      ...state,
      openModal,
      closeModal,
      selectProject,
      closeProject,
      openCompare,
      openPlayground,
    }),
    [state, openModal, closeModal, selectProject, closeProject, openCompare, openPlayground]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI phải được dùng bên trong <UIProvider>');
  return ctx;
}
