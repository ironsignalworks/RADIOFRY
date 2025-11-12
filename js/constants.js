/**
 * Reverb Presets
 * Impulse response file mappings
 */

export const REVERB_PRESETS = {
  'small-room': 'reverbs/small-room.wav',
  'batcave': 'reverbs/Batcave.wav',
  'battery-benson': 'reverbs/BatteryBenson.wav',
  'battery-brannan': 'reverbs/BatteryBrannan.wav',
  'battery-powell': 'reverbs/BatteryPowell.wav',
  'battery-quarles': 'reverbs/BatteryQuarles.wav',
  'battery-randol': 'reverbs/BatteryRandol.wav',
  'battery-tolles': 'reverbs/BatteryTolles.wav',
  'cathedral': 'reverbs/CathedralRoom.wav',
  'discovery': 'reverbs/DiscoveryRoom.wav',
  'drainage': 'reverbs/DrainageTunnel.wav',
  'fort-pillbox': 'reverbs/FortWordenPillbox.wav',
  'fort-tunnel': 'reverbs/FortWordenTunnel.wav',
  'harbor-entrance': 'reverbs/HarborEntranceControlPost.wav',
  'lake-merritt': 'reverbs/LakeMerrittBART.wav',
  'lawrence-welk': 'reverbs/LawrenceWelkCave.wav',
  'nancy-lake': 'reverbs/NancyLakeTunnel.wav',
  'portage-creek': 'reverbs/PortageCreekTunnel.wav',
  'port-townsend': 'reverbs/PortTownsendSkatepark.wav',
  'qasgiq': 'reverbs/Qasgiq.wav',
  'salton-sea': 'reverbs/SaltonSeaDrainagePipe.wav',
  'square-victoria': 'reverbs/SquareVictoriaDome.wav',
  'tijuana': 'reverbs/TijuanaAqueductTunnel.wav',
  'tony-knowles': 'reverbs/TonyKnowlesCoastalTrailTunnel.wav',
  'tunnel-heaven': 'reverbs/TunnelToHeaven.wav',
  'tunnel-hell': 'reverbs/TunnelToHell.wav'
};

export const PRESETS = {
  CHARRED: {
    distortion: true,
    echo: false,
    crush: true,
    glitch: false,
    freq: 900,
    pitch: 0.95,
    vol: 1
  },
  BAKED: {
    distortion: true,
    echo: true,
    crush: false,
    glitch: false,
    freq: 1400,
    pitch: 1.05,
    vol: 1
  },
  FRIED: {
    distortion: false,
    echo: true,
    crush: true,
    glitch: true,
    freq: 1100,
    pitch: 1.0,
    vol: 1
  }
};
