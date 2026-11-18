# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Add any project specific keep options here:

# @generated begin expo-build-properties - expo prebuild (DO NOT MODIFY)
# react-native-reanimated / worklets
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.worklets.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }
# Libraries reached through JNI / reflection (belt and braces; most ship consumer rules)
-keep class com.swmansion.gesturehandler.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class expo.modules.** { *; }
-keep class com.margelo.nitro.** { *; }
-keep class com.mrousavy.mmkv.** { *; }
-keep class com.tencent.mmkv.** { *; }
-keep class com.google.android.play.core.** { *; }
-dontwarn com.google.android.play.core.**
# @generated end expo-build-properties