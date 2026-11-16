package cz.workoutdenik.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

public class MainActivity extends BridgeActivity {

  // Vlastní doplňky (F6-04): SamsungHealthPlugin je v APK, jen když se sestavovalo s knihovnou Samsung Health
  // Data SDK (app/build.gradle), proto se hledá podle názvu. Registrace musí být před super.onCreate.
  @Override
  public void onCreate(Bundle savedInstanceState) {
    try {
      Class<?> samsung = Class.forName("cz.workoutdenik.app.SamsungHealthPlugin");
      registerPlugin(samsung.asSubclass(Plugin.class));
    } catch (ClassNotFoundException e) {
      // sestavení bez Samsung Health Data SDK
    }
    super.onCreate(savedInstanceState);
  }
}
