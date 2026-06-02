import { Modal, Pressable, Text } from 'react-native';
import { TouchButton } from './TouchButton';

type BottomSheetProps = {
  visible: boolean;
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  onClose: () => void;
};

export function BottomSheet({ visible, title, message, primaryLabel, onPrimary, onClose }: BottomSheetProps) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/30" onPress={onClose}>
        <Pressable className="rounded-t-2xl bg-white px-6 pb-8 pt-5" onPress={(event) => event.stopPropagation()}>
          <Text className="text-2xl font-bold text-product-deep">{title}</Text>
          <Text className="mt-2 text-base leading-6 text-gray-600">{message}</Text>
          <TouchButton label={primaryLabel} className="mt-5" onPress={onPrimary} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
