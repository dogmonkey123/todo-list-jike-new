import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

type Props = {
  label?: string;
  value?: Date | undefined;
  onChange: (d?: Date) => void;
};

export default function DateTimeRow({ label, value, onChange }: Props) {
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  const formatDate = (d?: Date) => (d ? d.toLocaleDateString() : '未设置');
  const formatTime = (d?: Date) => (d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '未设置');

  return (
    <View style={{ marginTop: 8 }}>
      {label ? <Text style={{ fontSize: 12, color: '#4b5563', marginBottom: 4 }}>{label}</Text> : null}
      <TouchableOpacity
        style={{ backgroundColor: '#ffffff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }}
        onPress={() => {
          const next = !showDate;
          setShowDate(next);
          if (next) setShowTime(false);
        }}
      >
        <Text>{formatDate(value)}</Text>
      </TouchableOpacity>

      {showDate && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_, selected) => {
            if (Platform.OS === 'android') setShowDate(false);
            if (selected) {
              const old = value || new Date();
              const merged = new Date(
                selected.getFullYear(),
                selected.getMonth(),
                selected.getDate(),
                old.getHours(),
                old.getMinutes(),
              );
              onChange(merged);
            }
          }}
        />
      )}

      <TouchableOpacity
        style={[{ backgroundColor: '#ffffff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginTop: 8 }]}
        onPress={() => {
          const next = !showTime;
          setShowTime(next);
          if (next) setShowDate(false);
        }}
      >
        <Text>时间：{formatTime(value)}</Text>
      </TouchableOpacity>

      {showTime && (
        <DateTimePicker
          value={value || new Date()}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
          onChange={(_, selected) => {
            if (Platform.OS === 'android') setShowTime(false);
            if (selected) {
              const old = value || new Date();
              const merged = new Date(
                old.getFullYear(),
                old.getMonth(),
                old.getDate(),
                selected.getHours(),
                selected.getMinutes(),
              );
              onChange(merged);
            }
          }}
        />
      )}
    </View>
  );
}
