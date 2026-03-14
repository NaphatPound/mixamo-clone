import type { SkeletonTemplate } from './SkeletonTemplate'

export const quadrupedTemplate: SkeletonTemplate = {
  id: 'quadruped',
  name: 'Quadruped',
  type: 'quadruped',
  bones: [
    { name: 'Root', parent: null, defaultLocalPosition: [0, 0.6, 0], landmarkKey: 'bodyCenter' },
    { name: 'Spine1', parent: 'Root', defaultLocalPosition: [0, 0, -0.15] },
    { name: 'Spine2', parent: 'Spine1', defaultLocalPosition: [0, 0, -0.15] },
    { name: 'Spine3', parent: 'Spine2', defaultLocalPosition: [0, 0, -0.15] },
    { name: 'Spine4', parent: 'Spine3', defaultLocalPosition: [0, 0, -0.15] },
    { name: 'Neck', parent: 'Spine4', defaultLocalPosition: [0, 0.1, -0.1], landmarkKey: 'neckBase' },
    { name: 'Head', parent: 'Neck', defaultLocalPosition: [0, 0.05, -0.15], landmarkKey: 'head' },
    { name: 'Jaw', parent: 'Head', defaultLocalPosition: [0, -0.05, -0.05] },
    // Front left leg
    { name: 'FrontLeftShoulder', parent: 'Spine4', defaultLocalPosition: [0.12, -0.05, -0.05], landmarkKey: 'frontLeftShoulder' },
    { name: 'FrontLeftUpperArm', parent: 'FrontLeftShoulder', defaultLocalPosition: [0, -0.2, 0] },
    { name: 'FrontLeftLowerArm', parent: 'FrontLeftUpperArm', defaultLocalPosition: [0, -0.2, 0], landmarkKey: 'frontLeftElbow' },
    { name: 'FrontLeftPaw', parent: 'FrontLeftLowerArm', defaultLocalPosition: [0, -0.15, 0], landmarkKey: 'frontLeftPaw' },
    // Front right leg
    { name: 'FrontRightShoulder', parent: 'Spine4', defaultLocalPosition: [-0.12, -0.05, -0.05], landmarkKey: 'frontRightShoulder' },
    { name: 'FrontRightUpperArm', parent: 'FrontRightShoulder', defaultLocalPosition: [0, -0.2, 0] },
    { name: 'FrontRightLowerArm', parent: 'FrontRightUpperArm', defaultLocalPosition: [0, -0.2, 0], landmarkKey: 'frontRightElbow' },
    { name: 'FrontRightPaw', parent: 'FrontRightLowerArm', defaultLocalPosition: [0, -0.15, 0], landmarkKey: 'frontRightPaw' },
    // Hind left leg
    { name: 'HindLeftHip', parent: 'Root', defaultLocalPosition: [0.1, -0.05, 0.15], landmarkKey: 'hindLeftHip' },
    { name: 'HindLeftUpperLeg', parent: 'HindLeftHip', defaultLocalPosition: [0, -0.2, 0] },
    { name: 'HindLeftLowerLeg', parent: 'HindLeftUpperLeg', defaultLocalPosition: [0, -0.2, 0], landmarkKey: 'hindLeftKnee' },
    { name: 'HindLeftPaw', parent: 'HindLeftLowerLeg', defaultLocalPosition: [0, -0.15, 0], landmarkKey: 'hindLeftPaw' },
    // Hind right leg
    { name: 'HindRightHip', parent: 'Root', defaultLocalPosition: [-0.1, -0.05, 0.15], landmarkKey: 'hindRightHip' },
    { name: 'HindRightUpperLeg', parent: 'HindRightHip', defaultLocalPosition: [0, -0.2, 0] },
    { name: 'HindRightLowerLeg', parent: 'HindRightUpperLeg', defaultLocalPosition: [0, -0.2, 0], landmarkKey: 'hindRightKnee' },
    { name: 'HindRightPaw', parent: 'HindRightLowerLeg', defaultLocalPosition: [0, -0.15, 0], landmarkKey: 'hindRightPaw' },
    // Tail
    { name: 'Tail1', parent: 'Root', defaultLocalPosition: [0, 0, 0.2], landmarkKey: 'tailRoot' },
    { name: 'Tail2', parent: 'Tail1', defaultLocalPosition: [0, 0.02, 0.1] },
    { name: 'Tail3', parent: 'Tail2', defaultLocalPosition: [0, 0.02, 0.1] },
    { name: 'Tail4', parent: 'Tail3', defaultLocalPosition: [0, 0.02, 0.1] },
  ],
  requiredLandmarks: [
    { key: 'head', label: 'Head', description: 'Center of the head', color: '#ff4444' },
    { key: 'neckBase', label: 'Neck Base', description: 'Base of the neck', color: '#ff8844' },
    { key: 'bodyCenter', label: 'Body Center', description: 'Center of the body', color: '#ffaa44' },
    { key: 'tailRoot', label: 'Tail Root', description: 'Base of the tail', color: '#ffcc44' },
    { key: 'frontLeftShoulder', label: 'Front Left Shoulder', description: 'Front left shoulder joint', color: '#44ff44' },
    { key: 'frontLeftPaw', label: 'Front Left Paw', description: 'Front left paw', color: '#44ff88' },
    { key: 'frontRightShoulder', label: 'Front Right Shoulder', description: 'Front right shoulder joint', color: '#44ffaa' },
    { key: 'frontRightPaw', label: 'Front Right Paw', description: 'Front right paw', color: '#44ffcc' },
    { key: 'hindLeftHip', label: 'Hind Left Hip', description: 'Hind left hip joint', color: '#4444ff' },
    { key: 'hindLeftPaw', label: 'Hind Left Paw', description: 'Hind left paw', color: '#4488ff' },
    { key: 'hindRightHip', label: 'Hind Right Hip', description: 'Hind right hip joint', color: '#44aaff' },
    { key: 'hindRightPaw', label: 'Hind Right Paw', description: 'Hind right paw', color: '#44ccff' },
  ],
  optionalLandmarks: [
    { key: 'frontLeftElbow', label: 'Front Left Elbow', description: 'Front left elbow', color: '#88ff88' },
    { key: 'frontRightElbow', label: 'Front Right Elbow', description: 'Front right elbow', color: '#88ff88' },
    { key: 'hindLeftKnee', label: 'Hind Left Knee', description: 'Hind left knee', color: '#8888ff' },
    { key: 'hindRightKnee', label: 'Hind Right Knee', description: 'Hind right knee', color: '#8888ff' },
  ],
  testAnimations: ['rest', 'walk', 'tailWag', 'bendTest'],
}
