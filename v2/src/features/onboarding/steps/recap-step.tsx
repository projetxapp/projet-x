import { Image } from 'expo-image';
import { View } from 'react-native';

import { Chip, Gradient, Text } from '@/components/ui';
import { COLLAB_MODES, HOURS } from '@/constants/profile-options';
import { MODES } from '@/constants/modes';
import { initials } from '@/lib/format';
import type { Mode } from '@/types/app';

import { ticketLabelFor, type OnboardingValues } from '../schema';

export function RecapStep({
  values,
  existingAvatar,
}: {
  values: OnboardingValues;
  existingAvatar?: string | null;
}) {
  const primary: Mode = values.roles[0] ?? 'talent';
  const avatar = values.photo?.uri ?? existingAvatar;
  return (
    <View className="gap-3">
      <View className="mb-2 items-center gap-2">
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            style={{ width: 88, height: 88, borderRadius: 44 }}
            contentFit="cover"
          />
        ) : (
          <Gradient
            colors={MODES[primary].gradient}
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text className="text-[30px] font-black text-white">
              {initials(values.firstName, values.lastName)}
            </Text>
          </Gradient>
        )}
        <Text variant="heading">Prêt·e, {values.firstName || 'toi'} ! 🎉</Text>
        <Text variant="caption">Tu pourras compléter ton profil à tout moment ✦</Text>
      </View>

      <View className="gap-1 rounded-card border border-line/10 bg-surface p-4">
        <Text variant="overline">👤 Identité</Text>
        <Text className="mt-1 text-[15px] font-bold text-text">
          {values.firstName} {values.lastName}
          {values.age ? `, ${values.age} ans` : ''}
        </Text>
        {values.city ? <Text variant="caption">📍 {values.city}</Text> : null}
        {values.school ? <Text variant="caption">🎓 {values.school}</Text> : null}
        {values.email ? <Text variant="caption">✉️ {values.email}</Text> : null}
      </View>

      {values.roles.map((role) => {
        const cfg = MODES[role];
        return (
          <View
            key={role}
            className="gap-2 rounded-card border p-4"
            style={{ borderColor: `${cfg.color}55`, backgroundColor: `${cfg.color}12` }}>
            <Text className={`text-[14px] font-extrabold ${cfg.cls.text}`}>
              {cfg.emoji} Profil {cfg.label}
            </Text>
            {role === 'talent' ? (
              <>
                {values.talentSkills.length > 0 ? (
                  <View className="flex-row flex-wrap gap-1.5">
                    {values.talentSkills.map((s) => (
                      <Chip key={s} label={s} size="sm" selected tone="talent" />
                    ))}
                  </View>
                ) : (
                  <Text variant="caption">Compétences à compléter dans ton profil</Text>
                )}
                {values.talentHours ? (
                  <Text variant="caption">
                    🕐 {HOURS.find((h) => h.id === values.talentHours)?.label}
                  </Text>
                ) : null}
                {values.talentCollab.length > 0 ? (
                  <Text variant="caption">
                    🤝{' '}
                    {values.talentCollab
                      .map((c) => COLLAB_MODES.find((m) => m.id === c)?.label)
                      .join(' · ')}
                  </Text>
                ) : null}
              </>
            ) : null}
            {role === 'project' ? (
              <>
                <Text className="text-[15px] font-bold text-project-fg">
                  🚀 {values.projectName || 'Nom à compléter'}
                </Text>
                <Text variant="caption">Stade : {values.projectStage}</Text>
                {values.projectNeeds.length > 0 ? (
                  <Text variant="caption">Recherche : {values.projectNeeds.join(', ')}</Text>
                ) : null}
              </>
            ) : null}
            {role === 'investor' ? (
              <>
                <Text variant="caption">
                  💰 {ticketLabelFor(values.investorTicket) ?? 'Ticket à compléter'}
                </Text>
                {values.investorSectors.length > 0 ? (
                  <Text variant="caption">Secteurs : {values.investorSectors.join(', ')}</Text>
                ) : null}
              </>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
