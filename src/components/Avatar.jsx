import React, {
  useRef,
  useMemo,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef
} from "react";
import { useFrame, useGraph, useLoader } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import * as THREE from "three";

// Azure viseme ID'lerini ReadyPlayerMe morph hedeflerine eşleyen tablo
const AzureToRPM = {
  0: "viseme_sil", 1: "viseme_PP", 2: "viseme_AA", 3: "viseme_TH",
  4: "viseme_O", 5: "viseme_U", 6: "viseme_I", 7: "viseme_E",
  8: "viseme_FF", 9: "viseme_kk", 10: "viseme_CH", 11: "viseme_SS",
  12: "viseme_nn", 13: "viseme_R", 14: "viseme_S", 15: "viseme_DD",
  16: "viseme_T", 17: "viseme_JJ", 18: "viseme_Z", 19: "viseme_L",
  20: "viseme_V", 21: "viseme_sil"
};

// Model bileşeni: avatar'ı ve animasyonları sahnede gösterir
export const Model = forwardRef(({ visemeQueue, speechStartTime, modelUrl }, ref) => {
  const group = useRef();

  // GLTF modeli yükleme
  const { scene } = useGLTF(modelUrl);
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);

  // FBX animasyonlarını yükleme
  const idle = useLoader(FBXLoader, "/animations/Idle.fbx").animations[0];
  const wave = useLoader(FBXLoader, "/animations/Wave.fbx").animations[0];
  const dance = useLoader(FBXLoader, "/animations/Dance.fbx").animations[0];
  const think = useLoader(FBXLoader, "/animations/Thinking.fbx").animations[0];
  const dying = useLoader(FBXLoader, "/animations/Dying.fbx").animations[0];
  const laughing = useLoader(FBXLoader, "/animations/Laughing.fbx").animations[0];

  // Animasyonlara isim verme
  idle.name = "Idle";
  wave.name = "Wave";
  dance.name = "Dance";
  think.name = "Thinking";
  dying.name = "Dying";
  laughing.name = "Laughing";

  // Animasyonları başlatmak için hook
  const { actions } = useAnimations([idle, wave, dance, think, dying, laughing], group);
  const [animation, setAnimation] = useState("Idle");

  // Animasyonu tetiklemek için dışa fonksiyon aç
  useImperativeHandle(ref, () => ({
    playAnimation: (name) => {
      if (actions[name]) setAnimation(name);
    }
  }));

  // Seçilen animasyonu oynat, bitince idle'a dön
  useEffect(() => {
    const anim = actions[animation];
    if (!anim) return;

    const prev = Object.values(actions).find((a) => a.isRunning() && a !== anim);
    anim.reset().play();

    if (prev) {
      anim.crossFadeFrom(prev, 0.6, false);
    } else {
      anim.fadeIn(0.6).play();
    }

    if (animation !== "Idle") {
      anim.setLoop(THREE.LoopOnce);
      anim.clampWhenFinished = true;

      const mixer = anim.getMixer();
      const onFinish = () => {
        const idleAnim = actions["Idle"];
        if (idleAnim) {
          idleAnim.reset().play();
          idleAnim.fadeIn(0.6).play();
          idleAnim.setLoop(THREE.LoopRepeat);
        }
        setAnimation("Idle");
      };
      mixer.addEventListener("finished", onFinish);
      return () => mixer.removeEventListener("finished", onFinish);
    } else {
      anim.setLoop(THREE.LoopRepeat);
    }
  }, [actions, animation]);

  // Konuşma sırasında morph hedeflerini kontrol etmek için referanslar
  const headRef = useRef();
  const morphStrength = useRef(0);
  const activeViseme = useRef(null);

  // Her frame'de morph'ları güncelle (dudak harektlerini)
  useFrame(() => {
    const now = Date.now();
    const elapsed = now - speechStartTime.current;

    const influences = headRef.current?.morphTargetInfluences;
    const dict = headRef.current?.morphTargetDictionary;
    if (!influences || !dict) return;

    // Kuyruktan sıradaki viseme'i çek
    while (visemeQueue.current.length > 0) {
      const next = visemeQueue.current[0];
      if (!next || next.offset > elapsed) break;
      visemeQueue.current.shift();

      const morphName = AzureToRPM[next.id];
      const index = dict[morphName];
      if (typeof index === "number") {
        activeViseme.current = index;
        morphStrength.current = 0.5;
      }
    }

    // Eski morph'ları sıfırla
    for (let i = 0; i < influences.length; i++) {
      influences[i] = Math.max(0, influences[i] - 0.015);
    }

    // Aktif morph'u uygula
    if (activeViseme.current !== null) {
      influences[activeViseme.current] = morphStrength.current;
      morphStrength.current = Math.max(0, morphStrength.current - 0.015);
    }
  });

  // Avatar'ın sahnedeki çizimi (mesh ve morph hedefleri)
 return (
    <group ref={group} dispose={null} scale={2.4} position={[0, -3.5, 0]}>
      <primitive object={nodes.Hips} />
      <skinnedMesh geometry={nodes.Wolf3D_Hair.geometry} material={materials.Wolf3D_Hair} skeleton={nodes.Wolf3D_Hair.skeleton} />
      <skinnedMesh geometry={nodes.Wolf3D_Body.geometry} material={materials.Wolf3D_Body} skeleton={nodes.Wolf3D_Body.skeleton} />
      <skinnedMesh geometry={nodes.Wolf3D_Outfit_Bottom.geometry} material={materials.Wolf3D_Outfit_Bottom} skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton} />
      <skinnedMesh geometry={nodes.Wolf3D_Outfit_Footwear.geometry} material={materials.Wolf3D_Outfit_Footwear} skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton} />
      <skinnedMesh geometry={nodes.Wolf3D_Outfit_Top.geometry} material={materials.Wolf3D_Outfit_Top} skeleton={nodes.Wolf3D_Outfit_Top.skeleton} />
      <skinnedMesh name="EyeLeft" geometry={nodes.EyeLeft.geometry} material={materials.Wolf3D_Eye} skeleton={nodes.EyeLeft.skeleton} morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary} morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences} />
      <skinnedMesh name="EyeRight" geometry={nodes.EyeRight.geometry} material={materials.Wolf3D_Eye} skeleton={nodes.EyeRight.skeleton} morphTargetDictionary={nodes.EyeRight.morphTargetDictionary} morphTargetInfluences={nodes.EyeRight.morphTargetInfluences} />
      <skinnedMesh name="Wolf3D_Head" ref={headRef} geometry={nodes.Wolf3D_Head.geometry} material={materials.Wolf3D_Skin} skeleton={nodes.Wolf3D_Head.skeleton} morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary} morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences} />
      <skinnedMesh name="Wolf3D_Teeth" geometry={nodes.Wolf3D_Teeth.geometry} material={materials.Wolf3D_Teeth} skeleton={nodes.Wolf3D_Teeth.skeleton} morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary} morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences} />
    </group>
  );
});

// Kullanılacak tüm model ve animasyonları önceden yükle
useGLTF.preload("/model.glb");
useGLTF.preload("/female.glb");
useLoader.preload(FBXLoader, "/animations/Idle.fbx");
useLoader.preload(FBXLoader, "/animations/Wave.fbx");
useLoader.preload(FBXLoader, "/animations/Dance.fbx");
useLoader.preload(FBXLoader, "/animations/Thinking.fbx");
useLoader.preload(FBXLoader, "/animations/Dying.fbx");
useLoader.preload(FBXLoader, "/animations/Laughing.fbx");
