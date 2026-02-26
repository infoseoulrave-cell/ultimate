import { downloadMedia } from './download-media.js';
import { analyzeImage } from './analyze-image.js';
import { analyzeVideo } from './analyze-video.js';
import { transcribeAudio } from './transcribe-audio.js';

export async function replicateReference(url, instruction, ctx) {
  if (!url) return { error: 'url is required' };

  const dlResult = await downloadMedia(url, {}, ctx);
  if (!dlResult.ok) return { error: `Download failed: ${dlResult.error}`, details: dlResult };

  const filePath = dlResult.path;
  const mediaType = dlResult.mediaType;
  const mediaCtx = { ...ctx, allowDirs: [...(ctx?.allowDirs || []), filePath.replace(/[^/]+$/, '')] };
  const apiCtx = { ...mediaCtx, apiKey: ctx?._apiKey, apiBase: ctx?._apiBase, model: ctx?._model };

  let analysis = null;
  const analysisPrompt = instruction
    ? `이것은 레퍼런스 자료다. 다음 목적을 위해 분석해줘: ${instruction}\n\n상세하게 분석해줘: 구조, 레이아웃, 색상, 폰트, 텍스트 내용, 애니메이션/전환 효과, 타이밍, 스타일, 기술 스택 추정. 이것을 똑같이 재현하려면 무엇이 필요한지 단계별로 설명해줘.`
    : '이것은 레퍼런스 자료다. 이것을 똑같이 재현하기 위해 필요한 모든 세부사항을 분석해줘:\n1. 전체 구조와 레이아웃\n2. 색상 팔레트 (hex 코드)\n3. 폰트/타이포그래피\n4. 텍스트 내용 (보이는 모든 텍스트)\n5. 이미지/아이콘/그래픽 요소\n6. 애니메이션/전환 효과와 타이밍\n7. 스타일 패턴\n8. 기술 스택 추정 (HTML/CSS/JS, React, 등)\n9. 재현을 위한 단계별 구현 계획';

  if (mediaType === 'image') {
    analysis = await analyzeImage(filePath, analysisPrompt, apiCtx);
  } else if (mediaType === 'video') {
    analysis = await analyzeVideo(filePath, analysisPrompt, apiCtx);
  } else if (mediaType === 'audio') {
    analysis = await transcribeAudio(filePath, apiCtx);
  } else {
    return {
      ok: true,
      path: filePath,
      mediaType,
      metadata: dlResult.metadata,
      warning: 'Unknown media type. File downloaded but could not auto-analyze.',
    };
  }

  const replicationPlan = {
    source: url,
    mediaType,
    localPath: filePath,
    metadata: dlResult.metadata,
    analysis: analysis?.ok ? (analysis.analysis || analysis.transcript || analysis) : null,
    analysisError: analysis?.error || null,
  };

  if (mediaType === 'video' && analysis?.ok) {
    replicationPlan.frames = analysis.frames;
    replicationPlan.audio = analysis.audio;
    replicationPlan.duration = analysis.duration;
  }

  replicationPlan.nextSteps = mediaType === 'video'
    ? [
        '1. 프레임별 시각 분석과 오디오 전사 결과를 기반으로 전체 흐름을 이해한다',
        '2. 필요한 기술 스택을 결정한다 (HTML/CSS/JS, React, After Effects, FFmpeg 등)',
        '3. run_command로 프로젝트를 생성하고 필요한 패키지를 설치한다',
        '4. 각 프레임/씬에 해당하는 코드를 작성한다',
        '5. 애니메이션/전환 효과를 구현한다',
        '6. 결과를 확인하고 레퍼런스와 비교한다',
      ]
    : mediaType === 'image'
      ? [
          '1. 이미지 분석 결과를 기반으로 레이아웃/구조를 파악한다',
          '2. 색상, 폰트, 간격 등 디자인 토큰을 추출한다',
          '3. HTML/CSS 또는 적절한 기술로 구현한다',
          '4. 텍스트와 이미지 요소를 배치한다',
          '5. 결과를 확인하고 레퍼런스와 비교한다',
        ]
      : [
          '1. 오디오 전사 결과를 기반으로 내용을 파악한다',
          '2. 같은 구조와 내용으로 스크립트를 작성한다',
          '3. 필요한 도구로 재현한다',
        ];

  return { ok: true, ...replicationPlan };
}
