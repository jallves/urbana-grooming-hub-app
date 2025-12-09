# TEF Bridge - Keep JavaScript interface methods
-keepclassmembers class com.costaurbana.totem.TEFBridge {
    @android.webkit.JavascriptInterface <methods>;
}

-keep class com.costaurbana.totem.TEFBridge { *; }

# Keep JSON classes
-keep class org.json.** { *; }

# Keep PayGo SDK classes (quando integrado)
# -keep class br.com.paygo.** { *; }
