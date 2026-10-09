import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

/**
 * UIContext = Context API + useReducer.
 * Chỉ chứa state ÍT THAY ĐỔI (modal nào đang mở, dự án nào đang xem).
 * Ô tìm kiếm / danh mục thay đổi liên tục nên KHÔNG đặt ở Context
 * (đúng lưu ý ở slide 7) mà để trên URL, xem hooks/useProjectFilters.js.
 */

const UIContext = createContext(null);

const initialState = { modalType: null, selectedProject: null };

function uiReducer(state, action) {
  switch (action.type) {
    case 'OPEN_MODAL':
      return { ...state, modalType: action.payload };
    case 'CLOSE_MODAL':
      return { ...state, modalType: null };
    case 'SELECT_PROJECT':
      return { ...state, selectedProject: action.payload };
    case 'CLOSE_PROJECT':
      return { ...state, selectedProject: null };
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

  const value = useMemo(
    () => ({ ...state, openModal, closeModal, selectProject, closeProject }),
    [state, openModal, closeModal, selectProject, closeProject]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI phải được dùng bên trong <UIProvider>');
  return ctx;
}
