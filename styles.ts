import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modeTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    backgroundColor: '#e5e7eb',
  },
  modeTabActive: {
    backgroundColor: '#111827',
  },
  modeTabText: {
    fontSize: 12,
    color: '#4b5563',
  },
  modeTabTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modeHint: {
    fontSize: 12,
    color: '#6b7280',
  },
  modeSwitchText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  header: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inputIcon: {
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 4,
  },
  addButton: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  addButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    padding: 2,
  },
  filterTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  filterTabActive: {
    backgroundColor: '#111827',
  },
  filterTabText: {
    fontSize: 12,
    color: '#4b5563',
  },
  filterTabTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  counterText: {
    fontSize: 12,
    color: '#6b7280',
  },
  listWrapper: {
    flex: 1,
    marginTop: 12,
  },
  listContent: {
    paddingBottom: 40,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  todoMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  todoItemWork: {
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  todoItemStudy: {
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
  },
  todoItemLife: {
    borderLeftWidth: 3,
    borderLeftColor: '#f97316',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  todoText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  todoTextCompleted: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  deleteButton: {
    marginLeft: 8,
    padding: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  emptyDesc: {
    marginTop: 4,
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
  },
  footer: {
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  footerAction: {
    textAlign: 'center',
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '500',
  },
  footerActionDisabled: {
    color: '#cbd5f5',
  },
  templatePanel: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
  },
  templateSection: {
    marginBottom: 10,
  },
  templateLabel: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 4,
  },
  templateInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
  },
  templateInputButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  templateInputText: {
    fontSize: 13,
    color: '#111827',
  },
  templateInputPlaceholder: {
    fontSize: 13,
    color: '#9ca3af',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    marginRight: 8,
  },
  categoryTagActive: {
    backgroundColor: '#6366f1',
  },
  categoryTagText: {
    fontSize: 12,
    color: '#4b5563',
  },
  categoryTagTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default styles;

