import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SPACING, BORDER_RADIUS, FONT_WEIGHT, SHADOW, type ThemeColors } from '../constants/theme';
import { useTheme, useThemedStyles } from '../context/ThemeContext';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface PlotMapData {
  id: number;
  name: string;
  location_type: 'none' | 'point' | 'polygon';
  latitude?: number | null;
  longitude?: number | null;
  polygon_coords?: string | null;
  land_size_m2: number;
}

export interface LeafletMapProps {
  mode?: 'picker-point' | 'picker-polygon' | 'view';
  center?: Coordinate;
  initialCenter?: Coordinate;
  initialZoom?: number;
  selectedPoint?: Coordinate | null;
  polygonPoints?: Coordinate[];
  plots?: PlotMapData[];
  onMapClick?: (coord: Coordinate) => void;
  onPlotPress?: (plotId: number) => void;
  showLayerToggle?: boolean;
  style?: any;
}

const DEFAULT_CENTER: Coordinate = {
  latitude: -7.5,
  longitude: 110.0,
};

const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #e5e5e1;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      user-select: none;
      -webkit-user-select: none;
    }
    #map {
      width: 100%;
      height: 100%;
    }
    .custom-div-icon {
      background: transparent;
      border: none;
    }
    .plot-tooltip {
      background: #1B5E20 !important;
      color: #FFFFFF !important;
      border: 1px solid #4CAF50 !important;
      border-radius: 6px !important;
      font-size: 11px !important;
      font-weight: bold !important;
      padding: 3px 7px !important;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2) !important;
    }
    .plot-tooltip::before {
      border-top-color: #1B5E20 !important;
    }
    .leaflet-control-zoom {
      border: none !important;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25) !important;
    }
    .leaflet-control-zoom a {
      border-radius: 6px !important;
      width: 34px !important;
      height: 34px !important;
      line-height: 34px !important;
      color: #2E7D32 !important;
      font-weight: bold !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map;
    var osmLayer;
    var satLayer;
    var currentLayer;
    var currentLayerType = 'osm';

    var pickerMarker = null;
    var polygonVertexMarkers = [];
    var polygonShape = null;
    var plotLayers = [];

    // Initialize Map
    function initMap(lat, lng, zoom) {
      map = L.map('map', {
        zoomControl: true,
        attributionControl: false
      }).setView([lat, lng], zoom);

      // OpenStreetMap Layer
      osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      });

      // Esri Satellite Imagery Layer (High resolution, free for web map display)
      satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: '&copy; Esri World Imagery'
      });

      currentLayer = osmLayer;
      currentLayer.addTo(map);

      // Handle map click
      map.on('click', function(e) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'MAP_CLICK',
            latitude: e.latlng.lat,
            longitude: e.latlng.lng
          }));
        }
      });

      // Signal ready
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
      }
    }

    // Set Map Layer (streets or satellite)
    window.setLayer = function(layerType) {
      if (layerType === currentLayerType) return;
      map.removeLayer(currentLayer);
      if (layerType === 'satellite') {
        currentLayer = satLayer;
      } else {
        currentLayer = osmLayer;
      }
      currentLayer.addTo(map);
      currentLayerType = layerType;
    };

    // Center map
    window.panTo = function(lat, lng, zoom) {
      if (!map) return;
      if (zoom) {
        map.setView([lat, lng], zoom, { animate: true });
      } else {
        map.panTo([lat, lng], { animate: true });
      }
    };

    // Fit map bounds to coordinates array
    window.fitBounds = function(coords) {
      if (!map || !coords || coords.length === 0) return;
      var latLngs = coords.map(function(c) { return [c.latitude, c.longitude]; });
      map.fitBounds(latLngs, { padding: [30, 30], maxZoom: 17 });
    };

    // Update Single Point Picker
    window.setPickerPoint = function(coord) {
      if (pickerMarker) {
        map.removeLayer(pickerMarker);
        pickerMarker = null;
      }
      if (!coord) return;

      var icon = L.divIcon({
        className: 'custom-div-icon',
        html: '<div style="background:#2E7D32;width:34px;height:34px;border-radius:17px;display:flex;align-items:center;justify-content:center;border:3px solid #FFFFFF;box-shadow:0 3px 8px rgba(0,0,0,0.35);font-size:18px;">📍</div>',
        iconSize: [34, 34],
        iconAnchor: [17, 34]
      });

      pickerMarker = L.marker([coord.latitude, coord.longitude], { icon: icon }).addTo(map);
    };

    // Update Polygon Picker
    window.setPickerPolygon = function(points) {
      // Clear vertex markers
      polygonVertexMarkers.forEach(function(m) { map.removeLayer(m); });
      polygonVertexMarkers = [];

      // Clear polygon shape
      if (polygonShape) {
        map.removeLayer(polygonShape);
        polygonShape = null;
      }

      if (!points || points.length === 0) return;

      // Add numbered vertex markers
      points.forEach(function(pt, idx) {
        var vIcon = L.divIcon({
          className: 'custom-div-icon',
          html: '<div style="background:#2E7D32;width:26px;height:26px;border-radius:13px;display:flex;align-items:center;justify-content:center;border:2px solid #FFFFFF;box-shadow:0 2px 6px rgba(0,0,0,0.3);color:#FFFFFF;font-size:12px;font-weight:bold;">' + (idx + 1) + '</div>',
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        var vm = L.marker([pt.latitude, pt.longitude], { icon: vIcon }).addTo(map);
        polygonVertexMarkers.push(vm);
      });

      // Draw polygon or polyline
      var latLngs = points.map(function(p) { return [p.latitude, p.longitude]; });
      if (points.length >= 3) {
        polygonShape = L.polygon(latLngs, {
          color: '#2E7D32',
          fillColor: '#4CAF50',
          fillOpacity: 0.4,
          weight: 3
        }).addTo(map);
      } else if (points.length === 2) {
        polygonShape = L.polyline(latLngs, {
          color: '#2E7D32',
          weight: 3,
          dashArray: '5, 5'
        }).addTo(map);
      }
    };

    // Render Saved Plots in View Mode
    window.setPlots = function(plots) {
      plotLayers.forEach(function(l) { map.removeLayer(l); });
      plotLayers = [];

      if (!plots || plots.length === 0) return;

      var allCoords = [];

      plots.forEach(function(plot) {
        if (plot.location_type === 'point' && plot.latitude && plot.longitude) {
          allCoords.push([plot.latitude, plot.longitude]);

          var icon = L.divIcon({
            className: 'custom-div-icon',
            html: '<div style="background:#2E7D32;width:36px;height:36px;border-radius:18px;display:flex;align-items:center;justify-content:center;border:2.5px solid #FFFFFF;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:18px;">🌾</div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });

          var marker = L.marker([plot.latitude, plot.longitude], { icon: icon }).addTo(map);
          marker.bindTooltip(plot.name + ' (' + plot.land_size_m2 + ' m²)', {
            permanent: true,
            direction: 'top',
            className: 'plot-tooltip',
            offset: [0, -18]
          });

          marker.on('click', function() {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PLOT_CLICK',
                plotId: plot.id
              }));
            }
          });

          plotLayers.push(marker);
        } else if (plot.location_type === 'polygon' && plot.polygon_coords) {
          try {
            var coords = JSON.parse(plot.polygon_coords);
            if (coords && coords.length >= 3) {
              var polyLatLngs = coords.map(function(c) {
                allCoords.push([c.latitude, c.longitude]);
                return [c.latitude, c.longitude];
              });

              var poly = L.polygon(polyLatLngs, {
                color: '#2E7D32',
                fillColor: '#4CAF50',
                fillOpacity: 0.45,
                weight: 2.5
              }).addTo(map);

              var centerLat = coords.reduce(function(sum, c) { return sum + c.latitude; }, 0) / coords.length;
              var centerLng = coords.reduce(function(sum, c) { return sum + c.longitude; }, 0) / coords.length;

              poly.bindTooltip(plot.name + ' (' + plot.land_size_m2 + ' m²)', {
                permanent: true,
                direction: 'center',
                className: 'plot-tooltip'
              });

              poly.on('click', function() {
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'PLOT_CLICK',
                    plotId: plot.id
                  }));
                }
              });

              plotLayers.push(poly);
            }
          } catch (e) {}
        }
      });

      if (allCoords.length > 0) {
        map.fitBounds(allCoords, { padding: [40, 40], maxZoom: 17 });
      }
    };

    // Auto-init on script load
    document.addEventListener('DOMContentLoaded', function() {
      initMap(-7.5, 110.0, 14);
    });
  </script>
</body>
</html>
`;

export default function LeafletMap({
  mode = 'view',
  center,
  initialCenter = DEFAULT_CENTER,
  initialZoom = 15,
  selectedPoint,
  polygonPoints,
  plots,
  onMapClick,
  onPlotPress,
  showLayerToggle = true,
  style,
}: LeafletMapProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const webViewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [layerType, setLayerType] = useState<'osm' | 'satellite'>('osm');

  // Handle messages from Leaflet HTML
  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'MAP_READY') {
          setMapReady(true);
          // Initial pan to target
          const target = center || initialCenter;
          webViewRef.current?.injectJavaScript(`
            if (window.panTo) {
              window.panTo(${target.latitude}, ${target.longitude}, ${initialZoom});
            }
            true;
          `);
        } else if (data.type === 'MAP_CLICK') {
          if (onMapClick) {
            onMapClick({ latitude: data.latitude, longitude: data.longitude });
          }
        } else if (data.type === 'PLOT_CLICK') {
          if (onPlotPress) {
            onPlotPress(data.plotId);
          }
        }
      } catch (err) {
        console.warn('Leaflet message parse error:', err);
      }
    },
    [center, initialCenter, initialZoom, onMapClick, onPlotPress]
  );

  // Synchronize layer type (Streets vs Satellite)
  const toggleLayer = () => {
    const next = layerType === 'osm' ? 'satellite' : 'osm';
    setLayerType(next);
    webViewRef.current?.injectJavaScript(`
      if (window.setLayer) { window.setLayer('${next}'); }
      true;
    `);
  };

  // Synchronize Center when center prop changes
  useEffect(() => {
    if (!mapReady || !center) return;
    webViewRef.current?.injectJavaScript(`
      if (window.panTo) {
        window.panTo(${center.latitude}, ${center.longitude});
      }
      true;
    `);
  }, [center, mapReady]);

  // Synchronize Selected Point in picker mode
  useEffect(() => {
    if (!mapReady || mode !== 'picker-point') return;
    const ptJson = selectedPoint ? JSON.stringify(selectedPoint) : 'null';
    webViewRef.current?.injectJavaScript(`
      if (window.setPickerPoint) {
        window.setPickerPoint(${ptJson});
      }
      true;
    `);
  }, [selectedPoint, mapReady, mode]);

  // Synchronize Polygon Points in picker mode
  useEffect(() => {
    if (!mapReady || mode !== 'picker-polygon') return;
    const ptsJson = polygonPoints ? JSON.stringify(polygonPoints) : '[]';
    webViewRef.current?.injectJavaScript(`
      if (window.setPickerPolygon) {
        window.setPickerPolygon(${ptsJson});
      }
      true;
    `);
  }, [polygonPoints, mapReady, mode]);

  // Synchronize Plots in view mode
  useEffect(() => {
    if (!mapReady || mode !== 'view' || !plots) return;
    const plotsJson = JSON.stringify(plots);
    webViewRef.current?.injectJavaScript(`
      if (window.setPlots) {
        window.setPlots(${plotsJson});
      }
      true;
    `);
  }, [plots, mapReady, mode]);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: LEAFLET_HTML }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        overScrollMode="never"
        bounces={false}
      />

      {/* Layer Switcher Button (Osm Streets <-> Esri Satellite) */}
      {showLayerToggle && (
        <TouchableOpacity
          style={styles.layerBtn}
          onPress={toggleLayer}
          activeOpacity={0.8}
        >
          <Text style={styles.layerBtnIcon}>
            {layerType === 'osm' ? '🛰️' : '🗺️'}
          </Text>
          <Text style={styles.layerBtnText}>
            {layerType === 'osm' ? 'Satelit' : 'Peta Jalan'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Initial Map Loader */}
      {!mapReady && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loaderText}>Memuat peta OpenStreetMap...</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors, fs: typeof import('../constants/theme').FONT_SIZE) =>
  StyleSheet.create({
    container: {
      flex: 1,
      position: 'relative',
      backgroundColor: colors.background,
    },
    webview: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    layerBtn: {
      position: 'absolute',
      top: SPACING.sm,
      right: SPACING.sm,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingVertical: SPACING.xs + 2,
      paddingHorizontal: SPACING.sm + 2,
      borderRadius: BORDER_RADIUS.md,
      gap: 5,
      ...SHADOW.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      zIndex: 10,
    },
    layerBtnIcon: {
      fontSize: 14,
    },
    layerBtnText: {
      fontSize: fs.xs,
      fontWeight: FONT_WEIGHT.bold,
      color: colors.primaryDark,
    },
    loaderOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 5,
    },
    loaderText: {
      marginTop: SPACING.sm,
      fontSize: fs.xs,
      color: colors.textSecondary,
    },
  });
