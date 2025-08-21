// BikeModel.jsx
import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";

export function BikeModel(props) {
  const { scene } = useGLTF("/models/carbon_frame_bike.glb");

  useEffect(() => {
    console.log("GLTF Loaded:", scene);
  }, [scene]);

  return (
    <primitive object={scene} scale={0.5} position={[0, -1, 0]} {...props} />
  );
}
