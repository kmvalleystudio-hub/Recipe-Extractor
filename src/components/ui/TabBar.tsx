import { View, Text, Pressable, ScrollView } from 'react-native';

interface TabBarProps {
  tabs: { key: string; label: string }[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 pb-1"
      className="mb-5"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            className={`px-5 py-2.5 rounded-full ${
              isActive ? 'bg-mint' : 'bg-surface'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                isActive ? 'text-white' : 'text-muted'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
