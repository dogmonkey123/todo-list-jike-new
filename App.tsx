import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
// native date/time picker
import DateTimePicker from '@react-native-community/datetimepicker';
// @ts-ignore 模块由 Expo 提供，运行时可用
import * as Notifications from 'expo-notifications';
import styles from './styles';

type TodoFilter = 'all' | 'active' | 'completed';
type TodoMode = 'simple' | 'template';
type TodoCategory = 'work' | 'study' | 'life';

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
  mode: TodoMode;
  category?: TodoCategory;
  deadline?: number; // timestamp
  // absolute reminder time (timestamp)
  reminderAt?: number;
  notificationId?: string;
};

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [mode, setMode] = useState<TodoMode>('simple');
  const [category, setCategory] = useState<TodoCategory>('work');
  // use Date objects and native pickers for template mode
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
  const [showDeadlineDatePicker, setShowDeadlineDatePicker] = useState(false);
  const [showDeadlineTimePicker, setShowDeadlineTimePicker] = useState(false);

  const [reminderAt, setReminderAt] = useState<Date | undefined>(undefined);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | undefined>(undefined);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<TodoCategory>('work');
  const [editDeadlineDate, setEditDeadlineDate] = useState<Date | undefined>(undefined);
  const [editReminderAt, setEditReminderAt] = useState<Date | undefined>(undefined);
  const [showEditDeadlinePicker, setShowEditDeadlinePicker] = useState(false);
  const [showEditReminderPicker, setShowEditReminderPicker] = useState(false);

  // helpers to format date/time for display
  const formatDate = (d?: Date) => (d ? d.toLocaleDateString() : '未设置');
  const formatTime = (d?: Date) =>
    d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '未设置';

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    (async () => {
      await Notifications.requestPermissionsAsync();
    })();
  }, []);

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter((t) => !t.completed);
      case 'completed':
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  const activeCount = useMemo(
    () => todos.filter((t) => !t.completed).length,
    [todos],
  );

  const handleAdd = async () => {
    const title = input.trim();
    if (!title) return;
    let deadline: number | undefined;
    let reminderTimestamp: number | undefined;
    let notificationId: string | undefined;

    if (mode === 'template') {
      if (deadlineDate) {
        deadline = deadlineDate.getTime();
      }

      if (reminderAt) {
        reminderTimestamp = reminderAt.getTime();
      }

      // schedule using absolute reminder timestamp (if set)
      if (reminderTimestamp && reminderTimestamp > Date.now()) {
        const triggerDate = new Date(reminderTimestamp);
        const res = await Notifications.scheduleNotificationAsync({
          content: {
            title: '待办提醒',
            body: title,
          },
          trigger: triggerDate as any,
        });
        notificationId = res;
      }
      if (mode === 'template') {
        setDeadlineDate(undefined);
        setReminderAt(undefined);
      }
      // 添加后回到简单模式并显示全部
      setMode('simple');
      setFilter('all');
    }

    const newTodo: Todo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      completed: false,
      createdAt: Date.now(),
      mode,
      category: mode === 'template' ? category : undefined,
      deadline,
      reminderAt: reminderTimestamp,
      notificationId,
    };
    setTodos((prev) => [newTodo, ...prev]);
    setInput('');
    if (mode === 'template') {
      setDeadlineDate(undefined);
      setReminderAt(undefined);
    }
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
            }
          : t,
      ),
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target?.notificationId) {
        Notifications.cancelScheduledNotificationAsync(target.notificationId);
      }
      return prev.filter((t) => t.id !== id);
    });
  };

  const clearCompleted = () => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  };
  const renderTodoItemContent = (item: Todo) => {
    // const catColor = item.category === 'work' ? '#ff6b6b' : item.category === 'study' ? '#1e90ff' : '#2ecc71';
    const catColor = item.category
  ? item.category === 'work'
    ? '#ff6b6b'
    : item.category === 'study'
    ? '#1e90ff'
    : '#2ecc71'
  : '#c0c4cc';
    return (
      <View style={styles.todoItem}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            item.completed && styles.checkboxChecked,
          ]}
          onPress={() => toggleTodo(item.id)}
        >
          {item.completed && (
            <Ionicons name="checkmark" size={16} color="#fff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flex: 1, paddingHorizontal: 8 }}
          onPress={() => {
            // open editor for this todo
            setEditingTodoId(item.id);
            setEditTitle(item.title);
            setEditCategory(item.category || 'work');
            setEditDeadlineDate(item.deadline ? new Date(item.deadline) : undefined);
            setEditReminderAt(item.reminderAt ? new Date(item.reminderAt) : undefined);
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: catColor, marginRight: 8 }} />
            <Text
              style={[
                styles.todoText,
                item.completed && styles.todoTextCompleted,
              ]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
          </View>
          {item.mode === 'template' && item.deadline && (
            <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
              截止：{new Date(item.deadline).toLocaleString()}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteTodo(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#c23b22" />
        </TouchableOpacity>
      </View>
    );
  };

  const saveEdit = async () => {
  if (!editingTodoId) return;
  const id = editingTodoId;
  const target = todos.find((t) => t.id === id);
  if (target?.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(target.notificationId);
  }
  let newNotificationId: string | undefined;
  if (editReminderAt && editReminderAt.getTime() > Date.now()) {
    const res = await Notifications.scheduleNotificationAsync({
      content: { title: '待办提醒', body: editTitle },
      trigger: editReminderAt as any,
    });
    newNotificationId = res;
  }
  setTodos((prev) =>
    prev.map((t) =>
      t.id === id
        ? {
            ...t,
            title: editTitle,
            category: editCategory,
            deadline: editDeadlineDate ? editDeadlineDate.getTime() : undefined,
            reminderAt: editReminderAt ? editReminderAt.getTime() : undefined,
            notificationId: newNotificationId,
          }
        : t,
    ),
  );
  setEditingTodoId(undefined);
};

const cancelEdit = () => setEditingTodoId(undefined);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>我的待办</Text>
          <Text style={styles.subtitle}>简单高效的日常任务清单</Text>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="add-outline"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="添加一个新的待办事项..."
              placeholderTextColor="#aaa"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={mode === 'simple' ? handleAdd : undefined} // 键盘「完成」直接创建（只在简单模式响应 Enter）
              returnKeyType="done"
            />
          </View>
          <TouchableOpacity
            style={[
              styles.addButton,
              !input.trim() && styles.addButtonDisabled,
            ]}
            onPress={handleAdd}
            disabled={!input.trim()}
          >
            <Text style={styles.addButtonText}>
              {mode === 'simple' ? '添加' : '添加'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modeRow}>
          <ModeTab label="简单模式" value="simple" current={mode} onPress={setMode} />
          <ModeTab label="模板模式" value="template" current={mode} onPress={setMode} />
        </View>

        {mode === 'template' && (
          <View style={styles.templatePanel}>
            <View style={styles.templateSection}>
              <Text style={styles.templateLabel}>分类</Text>
              <View style={styles.categoryRow}>
                <CategoryTag label="工作" value="work" current={category} onPress={setCategory} />
                <CategoryTag label="学习" value="study" current={category} onPress={setCategory} />
                <CategoryTag label="生活" value="life" current={category} onPress={setCategory} />
              </View>
            </View>
            {/* Deadline: date + time pickers (native) */}
            <View style={styles.templateSection}>
              <Text style={styles.templateLabel}>截止日期</Text>
              <TouchableOpacity
                style={styles.templateInput}
                onPress={() => setShowDeadlineDatePicker((s) => !s)}
              >
                <Text>{formatDate(deadlineDate)}</Text>
              </TouchableOpacity>
              {showDeadlineDatePicker && (
                <DateTimePicker
                  value={deadlineDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(_, selected) => {
                    if (Platform.OS === 'android') setShowDeadlineDatePicker(false);
                    if (selected) {
                      const old = deadlineDate || new Date();
                      // keep time component if present
                      const merged = new Date(
                        selected.getFullYear(),
                        selected.getMonth(),
                        selected.getDate(),
                        old.getHours(),
                        old.getMinutes(),
                      );
                      setDeadlineDate(merged);
                    }
                  }}
                />
              )}

              <TouchableOpacity
                style={[styles.templateInput, { marginTop: 8 }]}
                onPress={() => setShowDeadlineTimePicker((s) => !s)}
              >
                <Text>时间：{formatTime(deadlineDate)}</Text>
              </TouchableOpacity>
              {showDeadlineTimePicker && (
                <DateTimePicker
                  value={deadlineDate || new Date()}
                  mode="time"
                  display="spinner"
                  onChange={(_, selected) => {
                    if (Platform.OS === 'android') setShowDeadlineTimePicker(false);
                    if (selected) {
                      const old = deadlineDate || new Date();
                      const merged = new Date(
                        old.getFullYear(),
                        old.getMonth(),
                        old.getDate(),
                        selected.getHours(),
                        selected.getMinutes(),
                      );
                      setDeadlineDate(merged);
                    }
                  }}
                />
              )}
            </View>

            {/* Reminder datetime picker (native), click to expand/collapse */}
            <View style={styles.templateSection}>
              <Text style={styles.templateLabel}>提醒时间</Text>
              <TouchableOpacity
                style={styles.templateInput}
                onPress={() => setShowReminderPicker((s) => !s)}
              >
                <Text>
                  {reminderAt ? `${formatDate(reminderAt)} ${formatTime(reminderAt)}` : '未设置'}
                </Text>
              </TouchableOpacity>
              {showReminderPicker && (
                <DateTimePicker
                  value={reminderAt || new Date()}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(_, selected) => {
                    if (Platform.OS === 'android') setShowReminderPicker(false);
                    if (selected) setReminderAt(selected);
                  }}
                />
              )}
            </View>
          </View>
        )}


        {editingTodoId && (
          <View style={[styles.templatePanel, { borderColor: '#ddd', marginBottom: 12 }]}>
            <Text style={styles.templateLabel}>编辑待办</Text>
            <TextInput style={styles.templateInput} value={editTitle} onChangeText={setEditTitle} />
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <CategoryTag label="工作" value="work" current={editCategory} onPress={setEditCategory} />
              <CategoryTag label="学习" value="study" current={editCategory} onPress={setEditCategory} />
              <CategoryTag label="生活" value="life" current={editCategory} onPress={setEditCategory} />
            </View>

            <View style={{ marginTop: 8 }}>
              <TouchableOpacity style={styles.templateInput} onPress={() => setShowEditDeadlinePicker(s => !s)}>
                <Text>截止：{formatDate(editDeadlineDate)} {formatTime(editDeadlineDate)}</Text>
              </TouchableOpacity>
              {showEditDeadlinePicker && (
                <DateTimePicker
                  value={editDeadlineDate || new Date()}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(_, s) => { if (Platform.OS === 'android') setShowEditDeadlinePicker(false); if (s) setEditDeadlineDate(s); }}
                />
              )}
            </View>

            <View style={{ marginTop: 8 }}>
              <TouchableOpacity style={styles.templateInput} onPress={() => setShowEditReminderPicker(s => !s)}>
                <Text>提醒：{editReminderAt ? `${formatDate(editReminderAt)} ${formatTime(editReminderAt)}` : '未设置'}</Text>
              </TouchableOpacity>
              {showEditReminderPicker && (
                <DateTimePicker
                  value={editReminderAt || new Date()}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(_, s) => { if (Platform.OS === 'android') setShowEditReminderPicker(false); if (s) setEditReminderAt(s); }}
                />
              )}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity onPress={cancelEdit} style={{ marginRight: 12 }}><Text>取消</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveEdit}><Text style={{ color: '#1e90ff' }}>保存</Text></TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.filterRow}>
          <View style={styles.filterTabs}>
            <FilterTab
              label="全部"
              value="all"
              current={filter}
              onPress={setFilter}
            />
            <FilterTab
              label="未完成"
              value="active"
              current={filter}
              onPress={setFilter}
            />
            <FilterTab
              label="已完成"
              value="completed"
              current={filter}
              onPress={setFilter}
            />
          </View>
          <Text style={styles.counterText}>未完成 {activeCount} 个</Text>
        </View>

        <View style={styles.listWrapper}>
          {filteredTodos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="checkbox-outline"
                size={40}
                color="#d0d4dd"
              />
              <Text style={styles.emptyTitle}>暂无待办</Text>
              <Text style={styles.emptyDesc}>
                输入内容并点击“添加”，开始你的第一条任务。
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredTodos}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderTodoItemContent(item)}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={clearCompleted}
            disabled={todos.every((t) => !t.completed)}
          >
            <Text
              style={[
                styles.footerAction,
                todos.every((t) => !t.completed) &&
                  styles.footerActionDisabled,
              ]}
            >
              清除已完成
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FilterTabProps = {
  label: string;
  value: TodoFilter;
  current: TodoFilter;
  onPress: (value: TodoFilter) => void;
};

function FilterTab({ label, value, current, onPress }: FilterTabProps) {
  const active = value === current;
  return (
    <TouchableOpacity
      style={[styles.filterTab, active && styles.filterTabActive]}
      onPress={() => onPress(value)}
    >
      <Text
        style={[
          styles.filterTabText,
          active && styles.filterTabTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

type ModeTabProps = {
  label: string;
  value: TodoMode;
  current: TodoMode;
  onPress: (value: TodoMode) => void;
};

function ModeTab({ label, value, current, onPress }: ModeTabProps) {
  const active = value === current;
  return (
    <TouchableOpacity
      style={[styles.modeTab, active && styles.modeTabActive]}
      onPress={() => onPress(value)}
    >
      <Text
        style={[styles.modeTabText, active && styles.modeTabTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

type CategoryTagProps = {
  label: string;
  value: TodoCategory;
  current: TodoCategory;
  onPress: (value: TodoCategory) => void;
};

function CategoryTag({
  label,
  value,
  current,
  onPress,
}: CategoryTagProps) {
  const active = value === current;
  const color = value === 'work' ? '#ff6b6b' : value === 'study' ? '#1e90ff' : '#2ecc71';
  return (
    <TouchableOpacity
      style={[styles.categoryTag, active && styles.categoryTagActive, { borderColor: color }]}
      onPress={() => onPress(value)}
    >
      <Text
        style={[
          styles.categoryTagText,
          active && styles.categoryTagTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}



