// This is the requested exercise catalog, not playback history or sample user data.
// Audio sources are supplied by GET /api/exercises. Never synthesize substitute audio.
export const exercises = [
  { id: 'body-scan', category: 'meditation', title: '身体扫描冥想', description: '把注意力轻轻带回身体，感受每一个部位。', icon: 'user' },
  { id: 'breath-awareness', category: 'meditation', title: '呼吸觉察冥想', description: '观察自然的呼吸，让思绪慢慢沉静。', icon: 'wind' },
  { id: 'loving-kindness', category: 'meditation', title: '慈心冥想', description: '练习以温柔的态度，面对自己与他人。', icon: 'heart' },
  { id: 'walking', category: 'meditation', title: '行走冥想', description: '在步伐与身体的移动中，觉察当下。', icon: 'activity' },
  { id: 'mindful-eating', category: 'meditation', title: '正念进食', description: '用感官重新感受食物与进食的过程。', icon: 'cup' },
  { id: 'bedtime', category: 'meditation', title: '睡前冥想', description: '放下白天的忙碌，为休息留出空间。', icon: 'moon' },
  { id: 'breath-478', category: 'breathing', title: '4-7-8 呼吸法', description: '跟随音频节奏，练习有意识的呼吸。', icon: 'wind' },
  { id: 'diaphragmatic', category: 'breathing', title: '腹式呼吸', description: '觉察呼吸时腹部自然的起伏。', icon: 'wind' },
  { id: 'box-breathing', category: 'breathing', title: '盒式呼吸', description: '体验四个阶段的平稳呼吸节律。', icon: 'wind' },
  { id: 'alternate-nostril', category: 'breathing', title: '交替鼻孔呼吸', description: '把注意力带回每一次吸气与呼气。', icon: 'wind' },
  { id: 'muscle-relaxation', category: 'relaxation', title: '全身肌肉放松', description: '依次觉察身体，体验紧绷与放松。', icon: 'user' },
  { id: 'quick-relaxation', category: 'relaxation', title: '快速放松训练', description: '从短暂的停顿开始，松一松肩膀。', icon: 'sun' },
  { id: 'sleep-relaxation', category: 'relaxation', title: '睡眠放松引导', description: '伴随温和引导，逐步放松身体。', icon: 'moon' },
];
export const metrics = [
  { key: 'sleep', title: '睡眠质量', icon: 'moon', low: '非常差', high: '非常好', color: '#6d91a3' },
  { key: 'anxiety', title: '焦虑程度', icon: 'activity', low: '没有焦虑', high: '非常强烈', color: '#c59c5f' },
  { key: 'depression', title: '低落程度', icon: 'heart', low: '没有低落', high: '非常强烈', color: '#a38ba8' },
  { key: 'happiness', title: '幸福感', icon: 'sun', low: '非常低', high: '非常高', color: '#548773' },
  { key: 'health', title: '总体健康', icon: 'leaf', low: '非常差', high: '非常好', color: '#7c9d64' },
];
export const activities = [
  { key: 'exercise', title: '运动', icon: 'activity' },
  { key: 'drinks', title: '饮料', icon: 'cup' },
  { key: 'sedentary', title: '久坐', icon: 'chair' },
  { key: 'high_salt', title: '高盐饮食', icon: 'salt' },
];
