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
  reminderOffsetMinutes?: number;
  notificationId?: string;
};

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [mode, setMode] = useState<TodoMode>('simple');
  const [category, setCategory] = useState<TodoCategory>('work');
  const [deadlineText, setDeadlineText] = useState('');
  const [reminderOffsetText, setReminderOffsetText] = useState('');

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
    let reminderOffsetMinutes: number | undefined;
    let notificationId: string | undefined;

    if (mode === 'template') {
      if (deadlineText) {
        const parsed = Date.parse(deadlineText);
        if (!Number.isNaN(parsed)) {
          deadline = parsed;
        }
      }
      const offset = parseInt(reminderOffsetText, 10);
      if (!Number.isNaN(offset) && offset > 0) {
        reminderOffsetMinutes = offset;
      }

      if (deadline && reminderOffsetMinutes) {
        const triggerTime = deadline - reminderOffsetMinutes * 60 * 1000;
        if (triggerTime > Date.now()) {
          const triggerDate = new Date(triggerTime);
          const res = await Notifications.scheduleNotificationAsync({
            content: {
              title: '待办提醒',
              body: title,
            },
            // 类型定义里没有 Date 触发器，这里直接按运行时支持的写法并断言
            trigger: triggerDate as any,
          });
          notificationId = res;
        }
      }
    }

    const newTodo: Todo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      completed: false,
      createdAt: Date.now(),
      mode,
      category: mode === 'template' ? category : undefined,
      deadline,
      reminderOffsetMinutes,
      notificationId,
    };
    setTodos((prev) => [newTodo, ...prev]);
    setInput('');
    if (mode === 'template') {
      setDeadlineText('');
      setReminderOffsetText('');
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
        <Text
          style={[
            styles.todoText,
            item.completed && styles.todoTextCompleted,
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteTodo(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#c23b22" />
        </TouchableOpacity>
      </View>
    );
  };

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
              onSubmitEditing={handleAdd}
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
              {mode === 'simple' ? '添加' : '添加模板'}
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
              <Text style={styles.templateLabel}>截止时间（例如 2025-12-04 21:30）</Text>
              <TextInput
                style={styles.templateInput}
                value={deadlineText}
                placeholder="输入截止日期时间"
                placeholderTextColor="#aaa"
                onChangeText={setDeadlineText}
              />
            </View>
            <View style={styles.templateSection}>
              <Text style={styles.templateLabel}>提醒时间（单位：分钟，如 5 或 60）</Text>
              <TextInput
                style={styles.templateInput}
                value={reminderOffsetText}
                placeholder="截止前多少分钟提醒"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                onChangeText={setReminderOffsetText}
              />
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
  return (
    <TouchableOpacity
      style={[styles.categoryTag, active && styles.categoryTagActive]}
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


