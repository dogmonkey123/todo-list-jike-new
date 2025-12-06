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
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
// native date/time picker
import DateTimePicker from '@react-native-community/datetimepicker';
// speech recognition will be required dynamically to avoid runtime crash in Expo Go
import * as chrono from 'chrono-node';
// @ts-ignore 模块由 Expo 提供，运行时可用
import * as Notifications from 'expo-notifications';
import styles from './styles';
import useRecording from './src/hooks/useRecording';
import DateTimeRow from './src/components/DateTimeRow';

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
  // native voice states (for @react-native-voice fallback/dev-client)
  const [listening, setListening] = useState(false);
  const [voiceText, setVoiceText] = useState(''); // live interim result from native Voice
  const [pendingVoiceText, setPendingVoiceText] = useState<string | undefined>(undefined); // recognized text awaiting confirmation
  // split edit deadline pickers into separate date/time toggles
  const [showEditDeadlineDatePicker, setShowEditDeadlineDatePicker] = useState(false);
  const [showEditDeadlineTimePicker, setShowEditDeadlineTimePicker] = useState(false);
  const [showEditReminderPicker, setShowEditReminderPicker] = useState(false);
  // refs to detect previous deadlines for relative reminder updates
  const prevDeadlineRef = React.useRef<number | undefined>(undefined);
  const prevEditDeadlineRef = React.useRef<number | undefined>(undefined);
  const FIVE_MIN = 5 * 60 * 1000;

  // STT backend config for useRecording hook — replace with your server/ngrok URL if needed
  const STT_BACKEND_URL = 'http://10.0.2.2:3000/api/stt/google';
  const STT_API_KEY: string | undefined = undefined;
  const { isRecording, isUploading, startRecording, stopRecording } = useRecording(STT_BACKEND_URL, STT_API_KEY);

  // When entering template mode, initialize defaults
  useEffect(() => {
    if (mode === 'template') {
      if (!deadlineDate) {
        const now = new Date();
        setDeadlineDate(now);
        prevDeadlineRef.current = now.getTime();
      }
      if (!reminderAt) {
        const base = (deadlineDate && deadlineDate.getTime()) || Date.now();
        setReminderAt(new Date(base - FIVE_MIN));
      }
      // ensure pickers are collapsed by default
      setShowDeadlineDatePicker(false);
      setShowDeadlineTimePicker(false);
      setShowReminderPicker(false);
    }
  }, [mode]);

  // Keep reminder relative to deadline if it was previously set as deadline - 5min
  useEffect(() => {
    const prev = prevDeadlineRef.current;
    if (!deadlineDate) {
      prevDeadlineRef.current = undefined;
      return;
    }
    const newTs = deadlineDate.getTime();
    const remTs = reminderAt ? reminderAt.getTime() : undefined;
    if (prev === undefined && remTs === undefined) {
      // both were unset previously; set reminder to new deadline -5min
      setReminderAt(new Date(newTs - FIVE_MIN));
    } else if (prev !== undefined && remTs !== undefined) {
      // if reminder was exactly prev - 5min (within 1s), shift it along
      if (Math.abs(remTs - (prev - FIVE_MIN)) < 1000) {
        setReminderAt(new Date(newTs - FIVE_MIN));
      }
    }
    prevDeadlineRef.current = newTs;
  }, [deadlineDate]);

  // For edit panel, keep similar behaviour when editing a todo
  useEffect(() => {
    if (editingTodoId) {
      // ensure edit pickers collapsed by default
      setShowEditDeadlineDatePicker(false);
      setShowEditDeadlineTimePicker(false);
      setShowEditReminderPicker(false);
      prevEditDeadlineRef.current = editDeadlineDate ? editDeadlineDate.getTime() : undefined;
    }
  }, [editingTodoId]);

  useEffect(() => {
    const prev = prevEditDeadlineRef.current;
    if (!editDeadlineDate) {
      prevEditDeadlineRef.current = undefined;
      return;
    }
    const newTs = editDeadlineDate.getTime();
    const remTs = editReminderAt ? editReminderAt.getTime() : undefined;
    if (prev === undefined && remTs === undefined) {
      setEditReminderAt(new Date(newTs - FIVE_MIN));
    } else if (prev !== undefined && remTs !== undefined) {
      if (Math.abs(remTs - (prev - FIVE_MIN)) < 1000) {
        setEditReminderAt(new Date(newTs - FIVE_MIN));
      }
    }
    prevEditDeadlineRef.current = newTs;
  }, [editDeadlineDate]);

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

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Audio } = require('expo-av');
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('需要麦克风权限', '请在系统设置中允许麦克风权限以启用按住说话功能');
        }
      } catch (e) {
        console.warn('request mic perm err', e);
      }
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

  // Voice helpers (dynamic require to avoid expo go crash)
  const startListening = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Voice = require('@react-native-voice/voice');
      setVoiceText('');
      setListening(true);
      Voice.removeAllListeners?.();
      Voice.onSpeechResults = (e: any) => {
        const text = (e.value && e.value[0]) || '';
        setVoiceText(text);
      };
      Voice.onSpeechEnd = () => setListening(false);
      Voice.onSpeechError = () => setListening(false);
      await Voice.start('zh-CN');
    } catch (err) {
      console.warn('voice start err', err);
      Alert.alert('语音不可用', '当前环境不支持语音识别（Expo Go 不包含）。请使用开发构建或原生应用以启用语音功能。');
      setListening(false);
    }
  };

  const stopListening = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Voice = require('@react-native-voice/voice');
      await Voice.stop();
      Voice.removeAllListeners?.();
    } catch (err) {
      console.warn('voice stop err', err);
    }
    setListening(false);
    if (voiceText) {
      setPendingVoiceText(voiceText);
      setVoiceText('');
    }
  };

  const confirmVoiceCreate = async (text: string) => {
    let deadlineTs: number | undefined;
    let reminderTs: number | undefined;
    try {
      const results = (chrono as any).zh.parse(text || '');
      if (results && results.length > 0) {
        deadlineTs = results[0].start ? results[0].start.date().getTime() : undefined;
        if (results[1] && results[1].start) reminderTs = results[1].start.date().getTime();
      }
    } catch (e) {
      console.warn('chrono parse error', e);
    }

    const title = text.replace(/在|到|之前|之前提醒|提醒我|提醒|几号|几点|什么时候/g, '').trim() || '语音待办';

    const newTodo: Todo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      completed: false,
      createdAt: Date.now(),
      mode: 'template',
      category: 'work',
      deadline: deadlineTs,
      reminderAt: reminderTs,
      notificationId: undefined,
    };

    if (reminderTs && reminderTs > Date.now()) {
      const res = await Notifications.scheduleNotificationAsync({
        content: { title: '待办提醒', body: newTodo.title },
        trigger: new Date(reminderTs) as any,
      });
      newTodo.notificationId = res;
    }

    setTodos((prev) => [newTodo, ...prev]);
    setPendingVoiceText(undefined);
    setMode('simple');
    setFilter('all');
  };

  const cancelVoice = () => setPendingVoiceText(undefined);

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
            {/* 按住录音：Expo Go 可用（会上传到后端做 Google STT） */}
            <TouchableOpacity
              onPressIn={async () => {
                try { await startRecording(); } catch (e) { Alert.alert('录音失败', '无法开始录音'); }
              }}
              onPressOut={async () => {
                try {
                  const text = await stopRecording();
                  if (text) setPendingVoiceText(text);
                } catch (e) {
                  Alert.alert('识别失败', '上传或识别出错，请重试');
                }
              }}
              style={{ marginLeft: 8 }}
            >
              <Ionicons
                name={isRecording ? 'mic' : 'mic-outline'}
                size={22}
                color={isRecording ? '#e53935' : '#666'}
              />
            </TouchableOpacity>
            {isUploading && <Text style={{ marginLeft: 8, color: '#666' }}>上传中...</Text>}
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
            <View style={styles.templateSection}>
              <Text style={styles.templateLabel}>截止日期</Text>
              <DateTimeRow label={undefined} value={deadlineDate} onChange={(d) => setDeadlineDate(d)} />
            </View>
            <View style={styles.templateSection}>
              <Text style={styles.templateLabel}>提醒时间</Text>
              <DateTimeRow value={reminderAt} onChange={(d) => setReminderAt(d)} />
            </View>
          </View>
        )}

        {pendingVoiceText && (
          <View style={[styles.templatePanel, { marginTop: 8 }]}> 
            <Text style={styles.templateLabel}>识别到的文本</Text>
            <Text style={{ marginTop: 6 }}>{pendingVoiceText}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity onPress={cancelVoice} style={{ marginRight: 12 }}><Text>取消</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => confirmVoiceCreate(pendingVoiceText)}><Text style={{ color: '#1e90ff' }}>确认添加</Text></TouchableOpacity>
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
              <DateTimeRow label="截止：" value={editDeadlineDate} onChange={(d) => setEditDeadlineDate(d)} />
            </View>

            <View style={{ marginTop: 8 }}>
              <DateTimeRow label="提醒：" value={editReminderAt} onChange={(d) => setEditReminderAt(d)} />
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



