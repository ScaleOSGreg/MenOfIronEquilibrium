import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronRight, Plus, Target, TrendingUp, Users, ArrowLeft, Flag,
  AlertTriangle, Edit3, X, Save, BookOpen, Compass, Shield, Camera, LogOut, UserPlus,
} from "lucide-react";
import { useAuth, signOut } from "./auth/AuthContext.jsx";
import {
  loadState, upsertGoal, deleteGoal as deleteGoalRow, upsertMark,
  addPhoto as addPhotoRow, deletePhoto as deletePhotoRow, updateProfile, inviteMan,
} from "./lib/storage.js";

/* ------------------------------------------------------------------ */
/*  BRAND — Men of Iron Brand Standards Rev 08.2016                    */
/*  Red  PMS 199  → #D50032   |  Dark PMS 433 → #132229                */
/*  Primary staging is the logo on WHITE (default version).            */
/* ------------------------------------------------------------------ */

const C = {
  red: "#D50032",
  redDk: "#B0002A",
  redSoft: "rgba(213,0,50,0.10)",
  redLine: "rgba(213,0,50,0.35)",
  ink: "#132229",          // PMS 433 — primary text
  bg: "#FFFFFF",
  shell: "#F4F5F4",         // app backdrop, faint cool grey
  panel: "#FFFFFF",
  line: "rgba(19,34,41,0.12)",
  lineHi: "rgba(19,34,41,0.22)",
  text: "#132229",
  sub: "#5B6A70",
  faint: "#93A0A4",
};

const LOGO_EQUILIBRIUM = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAWcAAAByCAIAAAAAtodGAAAsG0lEQVR42u19d5gcxZ12he6e6ckzm7WrCCjnjLJAYKIJJoNFNAYb/IHPxpbBYJ8R5wfsO8D+ELY4DCZbMsmAySAQCBEklCMSyqvVhsmpu6ruj9od9eSe2dmVQPU+++jRznZPdVd465cLMsaAgICAgGkg0QUCAgKCNQQEBARrCAgICNYQEBAQrCEgICBYQ0BAQECwhoCAgGANAQEBwRoCAgKCNQQEBARrCAgIHKOQRBf0MkgsQUNRgCDoZgIQBIAybFeR3Sp6VUCwxrcTTCdQwu1L3tl1x1/lKhfTSd4ru2jB+AnM+FzCpC3YeNvl9TddyL9Z9LCAYI1vJ2gsqbX6AWAFWMOUqCFhvTVAonHRpQKCNb7tQBDKEpQlAGE3WQPKGCJhmRIQrHFM6Cqs86e7XyK6UuBIbHyiC3ofUHSBgJA1BEqkDdj5U5JkISAgWOMYBWVU15lOSrKGQpSbZQSXCAjWOAbkDIssuR2Sy14Sa9CkxpJaFnEwoewICNb4VvOFhAEA1RfP8541HZpWT3gsxr4/PHXgoeezojwEaQgI1jgGgFQLUi0l32VThWlDQLDGsQoGSjJHdMZ9EprvuwQEBGt86xWVEjWLToeL6DiBo0ZeFl0gICAgWENAQECwhkB+bUdAQLCGgIDAUQ1hDe11sDzh4RCUngVb7GzvfBluwrwqIFjjG6ZVQFi57yr8d8EOAoI1vtFCBqEQI/8bKw888Bx221lXCAZEiISi7lMm9bnlEkap+ZIZDLC8pEApQGjv7/8eWr4WO1RGu8I9ECKhaONtV7hnjyupLQEBwRpHhDYYACC5t6Xj9RVSjYdpnbHhUMJ6W0Cu93XqLyVIGnmFFl4xMLJme8cbn0heB9O7GEpCenuwdv7pqecREBCscdRDkXF69hrEGBCCbJbSv6vIskc2RXLbJZdBrsEIEAplMe4CgjW+QWYNxgChjFB2OEgcMkIBLWPnL2a0oIBltgUYoULKEOgOhFp7lCgvogsEhKxRYYMAy/AxQggh/Ha5BwRxCHzLWINS2l2ppnRzPaWUMYYQyscRhBD+zaUyCGOMstwlbYo+Z76uMElkLO9nRyMJFuio7CtBpxUW8hHrzq5gqiEIEaxYQ+WNOwOg6DPk7MPU83ezZ8wvqwJL2MxblMMaqHdddIRSjFCq0UAw2N7uD0cilFKEoM1m83o8Pq8HY5yij5K4A0KIyxVVut8VrCwbxRERYMruKD5HTfZVdyRHQghECJm7vTsNlT3u3ZlsFZSpK7iETbHGvv0Hfvf7P+qElPUCkFIqy9Lddy6orvIxxooSM2MMIwQA+HjlZ2+9u2zVl2v37tsfDIYTySRjDEKgyLLD4Wiorxs+bPCcmdPnzprusNv5TDWzYyCEPvnsiz89/IjDZqeMGp9TUeSFdy3web0FnvPXv/v97j37LBYltQlACOPx+G233jxy+NCizwBz8AOPxeoJFaX8Ccdf5Mlnl772xttOp6OwsAkhtKmq1+vp29jnhOMHjRg2xOf1mhkRfsHqtev++MAiu81GKWWpIDiW+/EtiuLzefv36zt86OBRI4bxoSeEYly8oTXr1v/hgYdU1caY8XWgrut3/vI/Bg7olz3u/JNoLPar39wTDAYlLKXibRFCoVD4mvmXzZs7K+eb8s3vpVdef+6fLx7uQwYQRqFw+OQ5M6+df3m+LqKUIQS3bNt+z30PGCebgS6p3aYu/M3tLqej8LLif73nvvs3b91mtVo7v6qre/lbnHPWaRd/79yi3VgCawRD4ZdfezOpaQjB3PsZLDBtIaHEolh+9bP/B6p8Ba/tfD0I4etvvfvnvzy66su1iWRSUWRFljHGiiKnZoA/EGhpbf181ZdPPL1k0MD+8y+76Lorr1AUueg05V22d/+BpS++4vN4CCXGiaVa1Tt+8dPCvfHOsg/Xr99ks6mUpc2eqy6/FAwHrBz3BJ+HR5eGwl9kzfoNS178V3WVjyuDBZcl4/coslxXVzNt8sSrrrhk8sTxqWEt0Epzc8vSl17xul0km5uyZgzjEj8AFovS1KfPqSfPvvbKywf271d46DsbOtiy9KVX3S6nkQQhgMlk8uYbrhuY/1E1TXv9zXcOHmpVFDk1xBjjtrb2ObOmAwAoYyhPo5u3blvywss11VW6Tvi7YIzb2ju8Hs+18/NOGMYoAHjX7r1LXnjZlf7AnbMOokgkcv45Z86dNYNSmpK7c66pQ61t//v3pzv8AVmWMlrEGLe1ddTV1lz8vXNNHrFjijUwQm63S9O0zFFhjKtnXAQwDC8z7nWUUouiFJcCGEMQxmKxBXctfPofz0sSttvtDoedGZDa2SRJkmUZ2iEAYP+B5jt++1//eu2NB/9wzwnHDTIjcSiy7PW4PenTlFJqtVqLyrouh9Pj8dhUq5E1MMbytzEIwqaqXo/H43YbWIMBZgiKZ8xYZwgCQBnz+wNLXvzXi6+8fs38S39z+20YocKboSzLXo/b7XJRSjO+0PBrGn/whppbWhY98tg//vnSr35+y1VXXFJ06HlDLqezqyGYIgWp4EG5EEK325XQNEWWGGVdi18ihFoUpXAfWi0Wr9fjNvQhxohSalPVov0fjUZdTqfX7TZM1M5+wBhTSpctXzF31ozCQhbGeNWXayPRaF1Ndc7vYYwlk5r5jcvURGcAEEIIIWVtpIBSWnSnYoxBAILB0Pzrb1q2/OOa6mrGWCH7jYFEFEWprVFXr1l37iVXPvO3h0ePHGFG4iCEkPQHo5RSUrxuOKG8M0iKNRhj1HTnsByqSJkaCit2T/elFz52HCXovZLk9XgYYw8uWuwPBP/0h3uKitCEEEpItqxR+EZFltWqqmRSu/UXv+7wB2696YdcKSgy7oSkyRoQmJnbnU+IkOFKU4si1aixDwkhlNGiFqlAMKTpGsm1grji//HKz7hRr/AzLF+xUtf0nN/DZbdAMMjJ0ZSJpMf1Y9OGekrpDbf8/IOPVtTV1maMa+d+jhDGONvqyRjTdN3tdvv9gat++JMDzQchhNTUGmY51qG5G8s2QuSya5SpocBSX69yphEIIUoDzMEClPZpaHjimSVPPfdPhFBJvGOUnws3pOs6xqimuurue//n9bffxQiRkv190DxNl2mRLnck+GLOt2qsVuvWbTu2fbUTQphvi0UIEUo//Xx1TuNI6ppwOFx51mD5DbMYY4wQxgjjzoWNMe781YDCuglG6MFFi197453amhpN07Jtv9FYLBAK+QOBUCgUTyT4rDX2gq7rTodj9959C+66G0Jobl3DnOvBzD0VpdHyraHwSHA9BEDTtHAkEolEwpFIOBKJxeI5rfRE111Ox18e/Xs8HkcYFx4TlmthhLua6Gookd0QFztVq+W//vBgPJ5AEBag/u5kAVf0TmiONUKFKTUUDi1fsZIvopyiIoRw59e7tn+102K15nYeM4YwCkeiRT0VpWkonTtk1jdCCCORqK7rhe+khFosSj4upJQiCLfv2PngokeqfF4jZTDGMMbhcMRiUYYNGdxQV6Mollgstm//ge07voYQqKpKDJ4dTdervN5XX3/7jXfe+87JcwkhhdmqG5sx7M5+VUFnCet5WYNlDbqu67U1NY196lOLMxgK7/x6Vzwet9lsxoGmjFmt1q927Pxy7YapkycQaspEnxp9i6KMGj7M2LXBUHjHzl2aHrdnNESpzWbbtHnr+x9+dNopJxUY+lwGv6MxwI6/dDAYghAV6CMJSx8sX3HdlZfntMdxG+2nn68KBIM+nzefuIcgjESjiUTCarVWkjU6zVIwbfZEY7EfX3/1uDGjdEK4MslYJ5lzqYxfzyO1qqurcu7kPMJk0eLHQqFwxothjMPh8PQTp9xx260jhw9L2asSieQnn35+18J7t321I3uaShJ++JHHTz1pTnkOahMyCgQVn3nl+lBgr094hFAoHL7q8ot/c/ttqQ81Tduwacvtv71n9dr1GesZQphIJtdt2DR18gRmupcghIlEon/fppf+8bixZzRNW7dx852/+/2qL9fZ7baMrYgy+u6y5aedctJRpaHkuZOZkT8DwSCCMN/FlDFVtX65bn1be0eVL0e4AP91+cefQgQLtIgQisXjsXgPsEZWS1DTtBnTpsyeMa3s8eGhGc0HW/795jtOp8NIGQihaCw2YvjQJx95yGq1gMPBbdBiUWbPnPbMY38543uXtbd3yPJhZxil1G63f77qy7XrNo4ZXdQsmlNDKToBcriPWSk9ACs0G9kR2yQhZYwbLzCWIASSJI0dPXLR/feefNYFJFdcT3PLwfJeUNN0SZIYYzyQUpbl8WNGPbrogXlnfS8YCvM/peaSLMubt24DPRaUCMu+C5bZWCgUhgjm28kYY4qiNB9s+eyL1aedclKG/5UvrmgstmrNWtVqpXnTIxlCKB6Px+IxL3D3rF2DMQAhDEeihJBkMkmKIbddmlIAwFvvLjt4qFWW5Yy/akntpzfdYLVauNpitIclNa2hvu7mH14bjkQypghCKBqNvfHOe/mUvW7aNGH3rKGVncRH8DEgNAYuQkJIv75NY0ePjMZiGSMCAeSGj9KtMNCAw+JGbU31qfPmZgw9Y0yWpEOtbbF4HBY0bXwjwF8tlDW9c+r4yz78OCenAAA2bNy8Z+9+RVHyB4ZwyS4ZiUTNPls3xSyD+bMI8ilUAID3P/wIY2xciVys7de3ceb0qYwxScqUifgmc/qpJ9dWV2dYTzkBf/LpF/zxKr6NsMrbHcu2hh4tgWE8WocxVlNdRQnNEDUYYKrVWoYVJrf7BiHG2ODjj8teBhDCZFJLJpMVtQ51VyYsw4fCX40QEolEMEIZ9xtFOUqp1WL55LMvNE3LWGV8y/x45efxeNxIPanbmSHgSNO0yrNGT0xPbu+IxmIbNm2xWhSawRqJxJATjnc6HCyXNYTTTUN93eATjovHE0aHHKXUYlG279jZ1t5RZM8xfG2JCWSVzrhl3VmuvWGWM3ldHtM4bGrsUykVjBvmrRZLed6Q7Lt6Qygpa5jiiUQ0GkMIGZ+QUppMJg1BdsxqtX618+tNW7aB9BQ1vmWuWPmZUYXnZkH+62FBEUJdJ6FwpCdkjRz9YIwCKoCcS5d/uHv33uaWlowX469x3MD+AACW3/kCADjhuEGarmfYmSVJavf7d+3eA4rEX7DemgDfFKGhW28AITzYcghL2NjnjFJVtY4bMyrF9d3sF9blkc0eWb5hWC2lVUUztQGw7tk1yiKmWCwei8URQpzYuMO7rrbm5DmzYrF46rERQpFo9MOPPzGq5F2B5K3rN222Wi18sUAINU07+/RTHA670WgAAdAJCYXDFWaNnJzPGHPY7RhjRVEKqyc5B4aP+q49e2PReA7ljbGGhvoCHc4/b2rsw1h2iD5MJBJ79u4rxhplL1ZWYbW5XHso63kuYnnenxqgE4IQ2r1n74ZNW4yGNz6hR48YNmrEMC5aVsqksnXbVxmlkrlLuL621mKxFMp8Kc//BbvNqaWPazQaiycSCKFUJgUh1GZTp0war+vEqGjIkvzB8hXAYAbmNPHF6rUtBoshH4IZ06ZKOD0bBUJGaSgUMvl4puM1surxM8oUWX7vg+XtHX5CdIgO+3YMKYuQq2dzZ8/I9gzxi/ftP6ATPUcwCII8bxIWHIjqKl8OSRVCSmnzwUOlrkfz8aRm48h6ljggYD3ARSYmtSLLyFDKAAGw/0Dzz2//z0gk6nDYUzsbhDCR1G696QaMMSEU45JXD/fIpGYOpVSWZX8g+N6HH2V4XiGEmqaPHDEUAEAolYqE6vSSClnurQwAGIlEksmk0VrBZfC+jX2MgZ6UUVW1rtuwqflgS31drXGVffTJp5TQ1K+EEKfTUV9Xm0gmMsRzxlgwWGnW4KKFkTgoY6qqPvzo3ztV2Ty2LAhhLBZ/+5WlOf3JAIDWtvacHhoIEU+CLgyXy5nPF93e0dG9rbqE5dr9aA1wtJYmgwaJF3T5tt96b9meffsppRBAAEE4HNmwaUtrW1uKMjBCSU3r8Aduv+2WU06aTUuJ7zosM2JsSVc3MMbhSOQ/Ftx58GCLy+lMCx5nTJKl78ybC0xHRpfaC6y3mINfHopEUo7n1OZNCBk+bIjP6+nwBzsTWBmQZflQW9vKz74456zTuf8VIUwoMQaSIwhjyWT/vk2DBvTTND2zhyAIhsKVZo2MGK+umeSw2wuPEIRQtcZlSco3HYOhUO7QLwQtFqXoc1ktFghhzoSwcCRSRDaEsOxVVLYEynrVXcoq9RVGeVhR5J279mzeuj19lK12+2EpIxQOe72eOxf87JrvX2omCzkbGONQKPTskhcQRjzxlVCya/fe1958Z8u2rzIoA2McDIUmTxg3ddKEVH2Wo6wjS1ZRQqEwF8PT7ESM9evbOGzo4HffX64oTkO4Cnh/+cfnnHU66ComsnPn7m07dhw2aiAUTyQnjBtTV1uLYHZ4IOwJWSM3cRStDAghJIQWiJtIJJL5PPU5uSYDiizn6gIAIEgkkubnQomeV5ahorBu8U5PVeWBPTWlmUVRVKulqxHGGEjlKHPn//XXzL/tlh938Qgs9WG5u721rf2mny3I6GJVtbrSqwQhBAmlEMDbb7uV54+XKGtAk5fASnSd+WcLBkNG/QJCQCmzKApGeNqUSW+8/X7qT5RS1Wr59PPV8XjCarXouo4Q+vSzVcFAyBBvzRBC06ZOUhRZluVYImHgI4YgDFbcrtFNCby87jbTKMpjai27LZNaS9nWUFjRLjaXald56mGMEZLGuYYOZLIsvbfso+aDLWeedsp3z/gOMFVmLcf7I4S4bSvdoEZTlMHJRdd1fyBw38LfTJk4vjy5pvfUPXNzlXWJ4enZ9JAxarPZAADTp062qaqxHywWy9e79qzbsHHShHF8cn64YmVKeYcAaJpeU101fsxoQqhVtRqzaRkDEMFQqNI+lLz3d0Z5pTJcjUFfqLAPpSLQdT2fIGOiUZj9e9GbYE+szrJ9KGatobCyj8a6SpxwUMb4TEj1/M5du55/+bVrb7zlovnX7d23HyFUrHZB7o7P9uIbvwchFAgGGWMP3rfw2vmXmak0cWQMQ7CcEQ8EgxmXUcocdhsAYPjQwQP6900kEkb/azwe/+CjTwAAkiRFo7HVa9al/FkQoVg8PmLYkJrqKsaoarFkBJjz9KIKswbMI2tFItEOv9/vD3b4gx3+QNePv8Pv5//x+wMdfr+WPy9WUeTcdbspMxPkp+t67qXDgE219sRi7ZGC4hBUKGSpl/RyCICx7gWEMBKNdvj9qQssFovX4/b5vO8uW37BFdfuO3AAFgnwz0v9mSHlhj8lEomT58x6ZelTV1xyIclfBe/IGjfyFpdmRZZbIBDMrn5ot9sBAFardfKEcbF4IsWSPCR6+YqVfGGu35QWSM4jNaZNmchtQBaLJS1egTGEUNh0bGj52Wv8OU6cMrG+rpZ1aZLMUKqNGS6r9vmyN39+gcvpzBkaTCmNJxJFHyMWj3fVH8wYKuZ0OcE345iRo7FuaL4NA2Pk9wcvu+j8n/zoB0QnCCMAACH0UGvbq6+/+eSzS2VZ4tHlXJ2uqaratn3HgjsX/n3xnxmlpVqgNU3nY5gtsSKEYvHE4OMHjRg2RNO07DymEhQuc0u/vPoIsFz1MRBMcxTwRWG3ddYNnDl96hPPLEk9O6VUVa0bNm35etfugQP6f7zi03gibrfb+ChQSi2KZdqUSVwSUa1WTi6pYyIwQtFoNJlMKopSMdbI7laMUTAUu/mG6+bMnGaeaLI/rPJ5c3YfNedADgaDjOasYQxrqqqOkLmwPJHhqAlULTL0kBDi9XoGDehv/HTw8YOmT53Ut6nxroX3dlYABQAAkNS0Kp/3zXffX/nZqimTxheo0Mdy2jV8Tv6OkWgsmUwaFRBCiNvlfOTxpy447+yRQ4eYtGiwXu/GsvetYCiMYFoSCmPM7ugMR5gycXxVlS+ROCxuSJLU3tGx8ovVAwf0X/7Jp7IkpwSNZDLZ1NgwcsQwfqU1KwWW53bEYnEzrFGCEgizcpIghNFolBCaTGqE0Pw/uSPK+df1aajHCOfMqj3U2gaKxYYeam3LjvZjjEkYN/ZpKDYhctxY3CtUmmqQyyJQuelYtGZlj1hDIdR1nVKqaZoxPJRQeu38ywb272fUt/n1mqa//va75q3ICMJEItlQX/f2v5a++9rz7/37xb88cJ+mZUYDYowTieSDDy3uhWiXPHqwuTdipamX/DVD4VBGmjwDnXYNXdf7NNSPGDYklp6Zxihbs3aDrutbt391OFIDwVg8MW7MKIfdzqOrVNWS4c1FCMXjiWgsVmFrKMv1K0rV/iv0k9sayj/s17dJVa2E0Ky/Ih4SXjg2dPfe/dnFjgihdrutf7+mfAIOj/LIGG4IoabrXC3Kngr8E03TEkktcywZQwhbuCfS5PStBHPAXvGhsDzTOr2cJ5IwhgAoinLCcYMSiWRaEDBjsiRt3rINFEpFydZeGUaoyufxuN1ul3POrOmzZ5wYCoUzxA2P2/nq6299vupLVE7FUGCSyCRZyj4TgEd+FV1p0VgspzVUzW9360yTD0Uy5TIGus5/IQCAGSdO1pKaMZRGkqUdX+/asXNXIBA0hIdBSun0EyeDrlAJVVVpug8YQphIJkymvaKyybb785E/9IB+fWtrqjO2EcaYIstbt39VIHkBYcwY27b9KyV9OCGEmpZsqK/r19SYizUgAMDlckqSlLEieEWj9nZ/QYUo5Pf7M6KVeT0Yt9NppltgDqM666HYr56rG1pgBaqqlaX72nllyna/v2AqSo7gYgaApum8pDBj7EfXX519Ig8EUCfkj39aVPb7mmFeq8XisNszWInbOlpaWlmeQy35h83NBzMUDd4nHo8b5Klcw3khEo1kFMcFEHJrKN8pZ5w4xWq1GDPWJEk6dKh1w6bNuq4bA8ldTseUiRNSy8GmqhnZWwihZFLjgZEVYw2Y3buwAqxBKXU47MOHDkkkEiijaoDVsnnr9t179uXUGiiljNJdu/ds2brdml5GFSEYTyTGjBphsVhIVsAP/62mukq1Zgo43He1eeu2fC1SSrfv2HmotS0jQ5cQ4nTaq6t9oDuxzD0gY/eQJZgVHFNeFCf785SiykohI+494Wd2TJ86eeb0qZniBqUup/PdZcvf//AjhJBe+vkbhS+HMFXC0kd0kilDydLGLVshzOED4+ZGSunGLVsVi5JhR4AQNtbX53lrBgCIxxORaHZ9o05Zg7PnyBHD+vU97H9ljGGEw5HIVzt3GRuKxxPHDxp4/KAB3KoAALDZ1Oy31nXdZFB5+bIGH3xiLlM+n2mD0+ScWdN1omcsG0mSOvyBp5f8k08FQviyZZRSQjqTLJ9Z+kJHIJhVswcyBubNnZVzRvBe61NfX11VZeTjLgFHeeHlV/kpTbqupx6en1aJEHp6yfNa+l0IQU3T+9TXd+bawXKLvZV1HsqRQkbOK7drMMZ0nezYuUuRM6ulUErtqo2nb8ISXodl6BE3Xnc1yxU0iBD644MPAwCk0oODil7Pt5BBA/pnpFlSSu022+ervtyybTvGSNN044TnU3TZ8o83btpqU1Xj/Oeb4nHHDSzQeiwey6imAwCDCHK7BoSQUKparZPGj4nH4ikRTJKwPxBc+uK/Uj5XhFA8kZg8cRzGmFACumSN7Eo/hBCT4aGom1PHYbOZyZTPZ9rgattp8+Zml+QihHhczsWPPvnesuWKLHcdiwG5JYWn2y5+9Em3y0kNpy52ValtPHn2TJCrfiSfwTabOvj4QYlkMmMSOBz2j1d+vvC++zVNkyQp9fB8Li7+2xNLX3zF7XKl1SaAKJFMjh45vOwjPzp5o/zYkSPAGbIsIYTkrsxXbtfAGD/13NKvdn6tWi3pOiMgOqmrqwH5q6XkErYyDxaklM2ZOe3EyRND4bS6eJRSp8P+6RerFv/tiUg0GgqFGKMVf+lxY0ZnMx5CKJlM3nLbHbt275VlyTjhZUlatWbdL379u2yDiKZpdXW1Q084PidrHE6Tj8eNGgpjACPMY0NT182cfqKxkC0vF3Cg+aChfxhGiBs1UrDZ1JzrIhAImumK8uM1KGOq1brokcdefu2NwpH/PO31R9dfnX14MqfMhvq6s04/9dEnnqn2eXXjgkSI6Po1P7rl0gvPmzd3dmNDvVW1xuPx/Qea33rvg2eXPE8Zy6gUgDFub+/48fXXuN2ufOXtebn3OTOnvfbm2whB4zTmxPHgosXvLVs+Y9qUfn2bbFZrLB7fu//AipWfr/pyjd1uzxaaEILzTprd+7oEPEKUgSV8qLV989ZthHSOJqW0ta3t7Xc/eOLZpRk1yvmTEkpGjxwO8pyHml9TyEhOoQjhG6+76uNPPsuYboRQh91+973/s+iRxxv71C958n+teapslCMKQggAOHHKxCqvJ0PS5CcqrFm/8cwLLjtp1oyhQ07wuN2U0kOtbes2bFz24YqklrRaLDR9igZDoSkTxvPzonMZehgAMByJJpMZRf0YQshutxkFpKmTxvu8XqPUDCE0atA8kHzC2DGg60QlAIBNtWVPOdp1AlvFWCPnCTeKoiz7aIWm6UYJOzPKCwCEUUeHf+7s6SOHD80R0AUAY+zmG6596ZV/JzUdYyO5Mm4HXvy3J//2xDOqqsqSpOl6LBbXdN3ldEjpZaO4z3nQwAE/uPr7BQxvXMA54zvz7nvgoWS6uMEbdTmdm7duW712PUzptQBYLIrTmXlILz/eYcgJx8+ePrUbVWeO6kz5TP8UpU6H49XX33rl328aOy2RSOq67nI5s6suUkoddvvJc2aBcsp5pYsbjM2bO2vShHGr16xNpdimoCjK/gMHFEWGFU33QQhRSpv6NMycPvXlV9/weNzpZy9Su00NR6LPLH2BUsbPIWCASVhyOOzWXGcXIYQuufC8fO4b/lE4HOECr6H+PpNkiZ8OCwHgYkhTU5/hQwav/HxVqkYBSC8IGolEJ40fW1dbY+RQm03Nuc2blDW6VTeUZ8r7vB6v1+P1enxej6/rP4Zf3T6v1+NxR6MxkCeShzLWr2/T7bfd2uH34yz3BADA6/U4HA7uGYUQOhx2n9eTMTv5r4l44vf/eYfX4y6QXMjTcBvq6y698Dx+yna2HquqapXP6/N5fV6Pz+et8nlzbaFAwjgSid50/TV8cpRrCoXlzuee97vm336NbleMscNh93o9GSuB2wv9/sB3Tp47bMgJ3U8tY5RijG+49srs2I3UTmYySLQM/OgHVxuXcUqxopRJGHs9nmqf1+f1+nzeap/P7XZBmJkUzq11J8+ZNXPalLwHwXemyYf09DMiGGAyxsYzpXmm77Spk7I3v9Qw8QBu0HUeACzAGhD4K8sa+TbDonVDUybFDn8g7x6CECHkyssv/vH1VzcfbOFHe2Y4KXjvc6tP9nHTPD+6o8O/8K4F8+bOKprFhBCklN7y4x+OHD7UHwhmp+Rnv1c2ZSiyfPBQ63lnn3HR986hPZ8EUca22Ztmj5xngMuyHAqFG+rr7vjlT4u6NsxwHBc3Tj/15EkTxobDOar+G48NryC4uDF+7Ogbr7uypeVQNjHxCHrdYAolhGQE9fCksiqf9+47f1m0xWA4bEyTBwAwymRF5lEe/HP+78xpUzPzSgw6ndXaGUhu/CqbqmaLhBBCkxpKKbGh5W5KZoQfPioL7/rVT2++ob2jIxaPc0tbYdWX++QwRoFgkFL6wH0Lf3D1900c1Nj5VG6X85E//3d9bU17h1+SJJPbIG8UIdR8sGXOzGn333s36G7xqDIT4uDRedQg5BZrDCFsa2uv8vke+8uD/Zoai2pwJl+GMSZJ+Paf38JJCvaWZsdtcAt+fsslF553oLkZImQ+mZtbjgPBkKLIj/z5vwcN6F+0NwLBYEayHy9rYixuxtW90aOG923qkxFZ1+UZSDY1NvJAcqNuqKpWlFlajSGIKskaEIKuI6DLhCzJoUi4wMrgbnnK2F0LfvbYww/279vU2tYWDkcKd66maR3+QDAUnj1j2sv/eOKKSy4gxOyez3lqyODjX3jmsROnTGxta+OBcV1Z/pngnhSMMSHEHwhEItEfXP39px992OV09ObczVhmPU0bKedIxlnfOcGTX3VCIpFoW3tHMpE877tnvPr80xPGjSmsm3Sxf46vzC2ZUjr9xCm/+OlNB1sOEUIkCae8F9zxVaAhqRQfXyYbQogReuj+e//j5hvjsViH38+3qLQJ06W7pdYLACASjba2to0ZOfzFZx+fMW1KYVm4s/xfKGJccZIkQYhUVTVWYO/KZ7NNGDs6qWmZThxZ0jRt3JiRXLk2iieqqiqyggzfjxCWZYmbESpjDSWEdvj9SU1HuZxjRXVrjFBHILh37/7Cq4vnQlNKzzr91LmzZ/zzxVdefOXf6zZsikZjqmrNUcae0Ooq39TJEy887+w5M6dzRaYkNYETx8AB/V949vHnlr7w1HP/XL9xM5eJEEYYYYgO10qihPLMq+pq37y5s66df9nUyRNBidWZ8vZRWdlrsOeljWg02tbRAREkOskhfHKnX5fpG2OsKLLb5eo/bOiUSeO/e8apY0aNBCZK8mia1t7hZ5Sm4u4ggrFYPBAI5VNpKaU/vflGq9X6wP9f3NbWnppC8Xjc6XQWbkgnhBKamrgQwGQyWeSQc4PtDCN054KfnXnaKYsfe/LDjz451NrGJ8bh8ssQMMYo6VTZHA77uFEjL77g3EsvPE+WZZMZ/fsPNLd3+BFGvOchgvF43ONxKUqacsR9UjOmTX3k8acAA2nHJEu4vb2DqycZriuLogRDoVg8nqrZzs8t271nX8VYo7GhftH996bF7eTxmOTWaCDUNK2+rjZlmCi8kgmhdptt/mUXzb/soq937X7i2SUP/fUxo4mY12K5+Hvn3v3rX7rdrpQ2yyMIS1rDCCFKGULw0gvPv/TC8zdu3rp6zbpNW7bt23/AHwjE4wkAGITIblOrqnz9+zWNGj5swrgxDfV1fDHkrPvQIyaKfLf1mIjDF8DlF18wcdxYngfFsoYeGEZfwtjhsFdVVTXU1dbWVKfYlisshVsZO3rkE4v/zP2FqbXMC2rzBZbjGC2EGGM/+sHV5551+gfLV2zfsTMciWKM7Tb1+OMGcgt3ejAeAgCMHjni8b/+Kb0hAACklAzs38+MzJgquTxh3JgJ48Y0H2z5YvWadRs379q9p62tPRKNUUr4UcQet7uxT/3QwSeMHztqxLChqQ4pWtOUX3DBeWePHT3CkjppEUKi6263i5tUUs/JLz791JOe/tvDGOFUJifsvIWcNHsGMBxCyG8c2L/fow/dn8qf44NIGTN5lIwp1nC5nOeefUal1EMTFi/EQw8ZYwP695s0fpymL87ItNF1UltT7Xa7eOl3vglQxspw7HEi43LK8KGDhw8dbMbyByp+BHFZifKwm31dbHmMHT1y7OiRZdxOuqJpzbTSUF930fnnlPGElNI+DfXci1mRhszbKfgcqK+rPfO0U8487RQzHWI8C6LoM0wYO3rC2NEmL/Z6PBece7aZ9+L/cbmc559zZtlzwxRrmMkfN2kkM38xtyBQSnWdZObwAIYxOnCgGQAgyRIy5LwGgkG301lG7APf0zhVAUMJqcM9wBjfoEyOfS9IGr3jGaGshLKvqX4rSVUsMMEKfw+fGJQerrDC/5PvrgINcaNMqbKYoXWIUNqESXlzUubhivR8zu8p9b3K7vASWKPUSVBBuzVCyONxYZxWgIMS6rDbP/jok1Vfrh07emQkGt21Z+9nX6x+7c13QqHwS889LstyroLqZqdC7h7oaXtnOd/PevoUJdQrdTi7M8FKurfiMznfF3ZfdS2p50t9r272gwSOYvBub2yot9tsxOC7Zp1hueGLr7y+X1NjNBZrPtgSDkd4ANi+A80D+vVljGbX3ThqX7TsM+ULiwHf/NNjBY5GHNXrih/k2dTYp6lPQ9JQfYTLb4oiE0K2bNu+b/8BhJDX6/H5vJFIdNPmbaAbJw98w3BETmwUEKxxFG/BgBAiy/Lc2TNisVjGgZfcXaKqKq902GkEIfra9Ru+aQum/GrDUIgTAoI1shUwxthVV1zi83kyis2mhA5jtpssyRs3bwXdy5LqeZZg6T+cOMqyNxeuKJPZUNePgEA3IB3lz8ddXP37Nv3u1wt+fOsvnE6HxWIxMAXr8kx3mp8kCX+xek0wFOIHJsCjiTsgRgAA79kzRk8cBiR0eMFDAAjFbkdKKes+afDv6bfwhsZffB/gzLbkxpoy2hIQ+GawBugqCnDJBecihH57z33NB1sURZEVGSMEIWSM6oTomq5pGkLI5/OOHD40Fos7Hc6jUHACAEhep+R1FtLKStXi8kNprAGNNUK9ETjmWAN0RRBfdP53Z02f+o/nX/7woxW79+wLRcK6TiRJcjkdjX0aRgwbMmn8uPFjR/EDDcpagr2onuRcwyUv42KRFJVsS0DgG8UaKYmjvq72Jzde95Mbr4tEIsFQOKlpiiy7XS5jRbOjTTHp0RXLerEtAYFvGGtwiYPHtCGE7HY7L/GeYopUlDc8htaJYAQBwRrF9+nOmLbOGvldAaBHLnr1CGs7gjYEBGuUQB9AmPMEBI6IuUB0gdBQBASOCVnjmCWJzNN2KQOUAkoBLYVBhJVUQLDGMYLsE6uRRQYIQUXIjAKCNQSKMgihyGlrfe7t0Ir1wHxdAIxoKNrws8vcs8YxSkV4qIBgjWOKNhiUpfiOfdHNu0pQTTDS24PVl53Kv0H0ooBgjWOPOCyKpFrM3wExApRCRRadJyBY49glDkZKExkYoULKEOgOhForICAgWENAQEBoKAIAQoC6frL+VkLpMv4NIlhDQLDGtx4sqdFInNqsTEsdrsXSiQNkcQfMOkGWQQnTSJyZOGdMQCDvFsaEYexoJwwGIIxu3BnfuhsqisGQmfO0TJZ1KFoaawAImabbJwy1NNWC8k5/EBCsIVhDQECgJAhrqICAgGANAQEBwRoCAgKCNQQEBARrCAgICNYQEBAQEKwhICAgWENAQECwhoCAgGANAQEBwRoCAgLHKv4PP6trQPKDcLEAAAAASUVORK5CYII=";
const LOGO_MEN_OF_IRON = "data:image/png;base64,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";

const FS = [
  { key: "faith",    label: "Faith",    blurb: "The foundation. It starts with God.", icon: BookOpen },
  { key: "family",   label: "Family",   blurb: "Lead at home before anywhere else.",  icon: Shield },
  { key: "friends",  label: "Friends",  blurb: "Don't do life alone.",                icon: Users },
  { key: "fitness",  label: "Fitness",  blurb: "Steward the body you were given.",    icon: TrendingUp },
  { key: "finances", label: "Finances", blurb: "Manage what you've been entrusted.",  icon: Target },
];

const RAG = {
  green: { label: "On Track",  dot: "#2E8B57", soft: "rgba(46,139,87,0.12)",  text: "#1F6B40" },
  amber: { label: "At Risk",   dot: "#C8881C", soft: "rgba(200,136,28,0.14)", text: "#9A6710" },
  red:   { label: "Off Track", dot: C.red,     soft: C.redSoft,               text: C.redDk },
};

/* ------------------------------------------------------------------ */
/*  STORAGE — Supabase-backed (the seam from the build spec)           */
/*  loadState / per-action mutators live in src/lib/storage.js          */
/* ------------------------------------------------------------------ */

// (legacy seedState left for reference but never used now)
const _seedStateUnused = () => ({
  people: {
    greg:  { id: "greg",  name: "Greg Serio",  role: "mentee", retreat: "Equilibrium Retreat", photo: "" },
    // one demo brother so the Team view isn't empty — delete freely
    sample_dave:   { id: "sample_dave",   name: "Dave",   role: "mentee", retreat: "Equilibrium Retreat", photo: "" },
  },
  goals: {
    greg: [
      // ---- FAITH ----
      { id: "f1", f: "faith", title: "Read & reflect on all books written by Paul",
        smart: { s: "Read and reflect on every book written by Paul (the Epistles)",
          m: "2 books per month", a: "Steady reading pace alongside reflection",
          r: "Deepen my foundation in the Word", t: "By Aug 31" },
        note: "Share reflections at EQ meets and with Shawn.", photos: [] },
      { id: "f2", f: "faith", title: "90 min/week of solitude",
        smart: { s: "Dedicated solitude to reflect and write", m: "90 minutes per week",
          a: "Blocked weekly on the calendar", r: "Hear God and process honestly",
          t: "Weekly, ongoing" },
        note: "Reflect and share writings with EQ group and Shawn.", photos: [] },
      { id: "f3", f: "faith", title: "Invite 3 new men/week to small group",
        smart: { s: "Personally invite new men into the men's small group",
          m: "3 invitations per week", a: "Through existing relationships and church",
          r: "Multiply the brotherhood", t: "Weekly, ongoing" },
        note: "", photos: [] },

      // ---- FAMILY ----
      { id: "fa1", f: "family", title: "Set & track weekly SMART goals with each son",
        smart: { s: "Each son sets 2 SMART goals from the 5F's of his choice; track weekly",
          m: "2 goals each, documented monthly", a: "Weekly check-in with each son",
          r: "Disciple my sons in the 5F rhythm", t: "Established by May 1" },
        note: "Document monthly & share progress with EQ brothers and Shawn.", photos: [] },
      { id: "fa2", f: "family", title: "Text/call Grandpa 3x/week",
        smart: { s: "Reach out to Grandpa to encourage and show the love of God",
          m: "3x per week", a: "Text or call, brief is fine",
          r: "Love him and point him to God", t: "Weekly, ongoing" },
        note: "Add his responses to my gratitude journal. Share with EQ brothers and Shawn.", photos: [] },
      { id: "fa3", f: "family", title: "Continue 5F goals with Amber",
        smart: { s: "Maintain shared 5F goal rhythm with Amber", m: "Ongoing cadence already in place",
          a: "Already established", r: "Lead my marriage with intention", t: "Ongoing" },
        note: "Already in place.", photos: [] },

      // ---- FRIENDS ----
      { id: "fr1", f: "friends", title: "Set & review SMART goals with Ken, Gumby & Jon",
        smart: { s: "Set SMART goals with Ken, Gumby & Jon and review with them",
          m: "Reviewed 2x per month", a: "At church and our workouts",
          r: "Sharpen close friends intentionally", t: "2x/month, ongoing" },
        note: "Keep confidentiality but share progress and pray for them with EQ brothers and Shawn.", photos: [] },
      { id: "fr2", f: "friends", title: "Host one lost friend for dinner monthly",
        smart: { s: "Host a friend far from God for dinner", m: "1x per month",
          a: "One intentional invite each month", r: "Build relationship and open doors",
          t: "Monthly, starting Apr 20" },
        note: "", photos: [] },

      // ---- FITNESS ----
      { id: "fi1", f: "fitness", title: "Walk 55K steps/week",
        smart: { s: "Hit a weekly step target", m: "55,000 steps per week (watch)",
          a: "~7,900 steps/day average", r: "Steward my body, model discipline",
          t: "Weekly, ongoing" },
        note: "Share progress from watch at EQ meetings and during Shawn check-ins.", photos: [] },
      { id: "fi2", f: "fitness", title: "Lose 30 lbs",
        smart: { s: "Lose 30 pounds", m: "Scale photo before each EQ meet",
          a: "Sustainable weekly loss", r: "Health and energy for the long game",
          t: "By Aug 31" },
        note: "Take pic of scale before EQ meets — upload here each month.", photos: [] },
      { id: "fi3", f: "fitness", title: "Prepare weekly menu with Amber",
        smart: { s: "Plan the weekly menu together with Amber", m: "1 menu per week",
          a: "Weekly planning session", r: "Support the weight goal and lead at home",
          t: "Weekly, starting Apr 20" },
        note: "Share menu with EQ group and Shawn.", photos: [] },

      // ---- FINANCES ----
      { id: "fn1", f: "finances", title: "2x 2025 revenue — one new client/month",
        smart: { s: "Double 2025 revenue by adding one new client per month",
          m: "1 new client per month", a: "April already secured",
          r: "Provide and build a compounding business", t: "Starting April, through 2025" },
        note: "Already got April.", photos: [] },
      { id: "fn2", f: "finances", title: "Post 5 pieces of LinkedIn content/week",
        smart: { s: "Publish content on LinkedIn consistently", m: "5 posts per week",
          a: "Batch-create weekly", r: "Visibility and business growth",
          t: "Weekly, starting w/o Apr 20" },
        note: "Share with those interested at EQ meets or connect with EQ brothers on LinkedIn for visibility.", photos: [] },
    ],
    sample_dave: [
      { id: "d1", f: "family", title: "Weekly date night", smart: { s: "Intentional time with my wife", m: "Every Friday", a: "Sitter booked monthly", r: "Marriage is priority", t: "Weekly, ongoing" }, note: "", photos: [] },
    ],
  },
  marks: {
    d1: [{ month: monthKeyRaw(), pct: 85, rag: "green", note: "Four for four this month.", blockers: "", commitment: "Plan dates a week ahead.", ts: Date.now() }],
  },
});

function monthKeyRaw(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

const monthKey = monthKeyRaw;
const monthLabel = (k) => {
  const [y, m] = k.split("-");
  return new Date(+y, +m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
};
const personGoals = (st, p) => st.goals[p] || [];
const goalLatest = (st, g) => {
  const a = (st.marks[g] || []).slice().sort((x, y) => x.month.localeCompare(y.month));
  return a[a.length - 1] || null;
};
const fProgress = (st, p, f) => {
  const gs = personGoals(st, p).filter((g) => g.f === f);
  if (!gs.length) return null;
  return Math.round(gs.map((g) => goalLatest(st, g.id)?.pct ?? 0).reduce((a, b) => a + b, 0) / gs.length);
};
const overall = (st, p) => {
  const gs = personGoals(st, p);
  if (!gs.length) return 0;
  return Math.round(gs.map((g) => goalLatest(st, g.id)?.pct ?? 0).reduce((a, b) => a + b, 0) / gs.length);
};
const worstRag = (st, p) => {
  const order = { green: 0, amber: 1, red: 2 };
  let w = null;
  personGoals(st, p).forEach((g) => {
    const r = goalLatest(st, g.id)?.rag;
    if (r && (w === null || order[r] > order[w])) w = r;
  });
  return w;
};
const uid = () => Math.random().toString(36).slice(2, 9);

/* ------------------------------------------------------------------ */
/*  MARK — authentic Men of Iron icon (twin peaks + figure)            */
/* ------------------------------------------------------------------ */

const ICON_MEN_OF_IRON = "data:image/png;base64,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";

function Mark({ size = 34 }) {
  return (
    <img src={ICON_MEN_OF_IRON} alt="Men of Iron"
      style={{ width: size, height: size, objectFit: "contain", display: "block" }} />
  );
}

/* ------------------------------------------------------------------ */
/*  PRIMITIVES                                                         */
/* ------------------------------------------------------------------ */

function Ring({ value, size = 78, stroke = 7, color = C.red }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(19,34,41,0.10)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (value / 100) * c}
        style={{ transition: "stroke-dashoffset 700ms cubic-bezier(.22,1,.36,1)" }} />
    </svg>
  );
}

function Bar({ value, color = C.red }) {
  return (
    <div style={{ height: 7, background: "rgba(19,34,41,0.08)", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 99,
        transition: "width 700ms cubic-bezier(.22,1,.36,1)" }} />
    </div>
  );
}

function RagPill({ rag }) {
  const r = RAG[rag] || RAG.green;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700,
      color: r.text, background: r.soft, padding: "3px 10px", borderRadius: 99,
      letterSpacing: ".04em", textTransform: "uppercase" }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: r.dot }} />{r.label}
    </span>
  );
}

function Avatar({ person, size = 46 }) {
  if (person?.photo) {
    return (
      <img src={person.photo} alt={person.name} style={{
        width: size, height: size, borderRadius: 99, objectFit: "cover",
        border: `2px solid ${C.line}`,
      }} />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 99, background: C.redSoft,
      display: "grid", placeItems: "center", ...display, fontSize: size * 0.4, color: C.red,
      border: `2px solid ${C.redLine}` }}>
      {person?.name?.[0] || "?"}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MILE MARKER MODAL                                                  */
/* ------------------------------------------------------------------ */

function MarkModal({ goal, existing, onSave, onClose }) {
  const [pct, setPct] = useState(existing?.pct ?? 0);
  const [rag, setRag] = useState(existing?.rag ?? "green");
  const [note, setNote] = useState(existing?.note ?? "");
  const [blockers, setBlockers] = useState(existing?.blockers ?? "");
  const [commitment, setCommitment] = useState(existing?.commitment ?? "");

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...sheet, maxWidth: 540 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={kicker}>{monthLabel(monthKey())} · Mile Marker</div>
            <h3 style={{ ...display, fontSize: 22, margin: "8px 0 0", color: C.text }}>{goal.title}</h3>
          </div>
          <button onClick={onClose} style={iconBtn}><X size={18} /></button>
        </div>

        <div style={{ marginTop: 24 }}>
          <label style={lbl}>Progress — <span style={{ color: C.red }}>{pct}%</span></label>
          <input type="range" min="0" max="100" value={pct}
            onChange={(e) => setPct(+e.target.value)}
            style={{ width: "100%", accentColor: C.red, marginTop: 10 }} />
        </div>

        <div style={{ marginTop: 20 }}>
          <label style={lbl}>Status</label>
          <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
            {Object.entries(RAG).map(([k, v]) => (
              <button key={k} onClick={() => setRag(k)} style={{
                flex: 1, padding: "10px 8px", borderRadius: 8, cursor: "pointer",
                border: rag === k ? `1.5px solid ${v.dot}` : `1.5px solid ${C.line}`,
                background: rag === k ? v.soft : "transparent",
                color: rag === k ? v.text : C.sub, fontWeight: 700, fontSize: 12.5,
                letterSpacing: ".03em", transition: "all 160ms" }}>{v.label}</button>
            ))}
          </div>
        </div>

        <Field label="Status note — where are you on this?" value={note} set={setNote}
          ph="Honest assessment of where this goal stands this month…" />
        <Field label="Blockers — what's in the way?" value={blockers} set={setBlockers}
          ph="Obstacles, friction, anything slowing you down…" />
        <Field label="Next-month commitment — what will you do before we meet again?" value={commitment} set={setCommitment}
          ph="The specific action you're committing to before the next Mile Marker…" />

        <button onClick={() => onSave({ pct, rag, note, blockers, commitment })}
          style={{ ...primaryBtn, width: "100%", marginTop: 26 }}>
          <Save size={16} /> Log this month's Mile Marker
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, set, ph }) {
  return (
    <div style={{ marginTop: 18 }}>
      <label style={lbl}>{label}</label>
      <textarea value={value} onChange={(e) => set(e.target.value)} placeholder={ph}
        style={{ ...inp, minHeight: 60, resize: "vertical", lineHeight: 1.5 }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  GOAL MODAL                                                         */
/* ------------------------------------------------------------------ */

function GoalModal({ fKey, existing, onSave, onClose }) {
  const [f, setF] = useState(existing?.f ?? fKey ?? "faith");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [sm, setSm] = useState({
    s: existing?.smart?.s ?? "", m: existing?.smart?.m ?? "", a: existing?.smart?.a ?? "",
    r: existing?.smart?.r ?? "", t: existing?.smart?.t ?? "",
  });
  const rows = [
    ["s", "Specific", "What exactly will be accomplished?"],
    ["m", "Measurable", "How will you know it's done?"],
    ["a", "Attainable", "Realistic with diligent effort?"],
    ["r", "Relevant", "Why does it matter to your walk?"],
    ["t", "Time-bound", "By when? Cadence or deadline."],
  ];
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...sheet, maxWidth: 560 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ ...display, fontSize: 22, margin: 0, color: C.text }}>
            {existing ? "Edit Goal" : "New SMART Goal"}
          </h3>
          <button onClick={onClose} style={iconBtn}><X size={18} /></button>
        </div>

        <div style={{ marginTop: 22 }}>
          <label style={lbl}>Which F?</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 9 }}>
            {FS.map((x) => (
              <button key={x.key} onClick={() => setF(x.key)} style={{
                padding: "8px 14px", borderRadius: 99, cursor: "pointer", fontSize: 12.5, fontWeight: 700,
                letterSpacing: ".02em",
                border: f === x.key ? `1.5px solid ${C.red}` : `1.5px solid ${C.line}`,
                background: f === x.key ? C.redSoft : "transparent",
                color: f === x.key ? C.redDk : C.sub }}>{x.label}</button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <label style={lbl}>Goal headline</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="A short name for this goal" style={inp} />
        </div>

        <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${C.line}` }}>
          <div style={kicker}>Make it S.M.A.R.T.</div>
          {rows.map(([k, name, hint]) => (
            <div key={k} style={{ marginTop: 14 }}>
              <label style={lbl}>{name} <span style={{ color: C.faint, fontWeight: 400 }}>· {hint}</span></label>
              <input value={sm[k]} onChange={(e) => setSm({ ...sm, [k]: e.target.value })} style={inp} />
            </div>
          ))}
        </div>

        <button onClick={() => { if (title.trim()) onSave({ f, title: title.trim(), smart: sm }); }}
          style={{ ...primaryBtn, width: "100%", marginTop: 24 }}>
          <Save size={16} /> {existing ? "Save changes" : "Add goal"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PROFILE MODAL — name + optional photo (URL or upload)              */
/* ------------------------------------------------------------------ */

function ProfileModal({ person, onSave, onClose }) {
  const [name, setName] = useState(person?.name ?? "");
  const [photo, setPhoto] = useState(person?.photo ?? "");
  const [err, setErr] = useState("");
  const fileRef = useRef();

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.4 * 1024 * 1024) {
      setErr("Image is large — try one under ~1.4MB so it saves reliably.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setPhoto(reader.result); setErr(""); };
    reader.readAsDataURL(file);
  };

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...sheet, maxWidth: 460 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ ...display, fontSize: 22, margin: 0, color: C.text }}>Profile</h3>
          <button onClick={onClose} style={iconBtn}><X size={18} /></button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", margin: "22px 0 6px" }}>
          <Avatar person={{ name, photo }} size={92} />
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={lbl}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={inp} />
        </div>

        <div style={{ marginTop: 18 }}>
          <label style={lbl}>Photo <span style={{ color: C.faint, fontWeight: 400 }}>· optional</span></label>
          <div style={{ marginTop: 9, display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => fileRef.current?.click()} style={smallBtn}>
              <Camera size={14} /> {photo ? "Change photo" : "Upload from device"}
            </button>
            {photo && (
              <button onClick={() => setPhoto("")} style={smallGhost}>Remove</button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={pickFile} style={{ display: "none" }} />
          </div>
        </div>
        {err && <div style={{ fontSize: 12, color: C.redDk, marginTop: 8 }}>{err}</div>}

        <button onClick={() => { if (name.trim()) onSave({ name: name.trim(), photo }); }}
          style={{ ...primaryBtn, width: "100%", marginTop: 24 }}>
          <Save size={16} /> Save profile
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  INVITE MODAL — admin / mentor invites a man (Edge Function)        */
/* ------------------------------------------------------------------ */

function InviteModal({ callerGroupId, onClose }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      await inviteMan({ email: email.trim().toLowerCase(), full_name: name.trim(), group_id: callerGroupId });
      setMsg("Invite sent. He'll get an email with a link to set his password.");
      setEmail(""); setName("");
    } catch (err) {
      setMsg(err.message || "Could not send invite.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div onClick={onClose} style={overlay}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}
        style={{ ...sheet, maxWidth: 460 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ ...display, fontSize: 22, margin: 0, color: C.text }}>Invite a man</h3>
          <button type="button" onClick={onClose} style={iconBtn}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 13, color: C.sub, marginTop: 8 }}>
          Equilibrium Retreat is invite-only. He'll get an email to set his password.
        </p>
        <div style={{ marginTop: 14 }}>
          <label style={lbl}>Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required style={inp} />
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={lbl}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inp} />
        </div>
        <button type="submit" disabled={busy}
          style={{ ...primaryBtn, width: "100%", marginTop: 22, opacity: busy ? 0.7 : 1 }}>
          <Save size={16} /> {busy ? "Sending…" : "Send invite"}
        </button>
        {msg && <div style={{ marginTop: 12, fontSize: 13, color: C.sub }}>{msg}</div>}
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  GOAL CARD                                                          */
/* ------------------------------------------------------------------ */

function GoalCard({ goal, mark, history, onMark, onEdit, onDelete, onAddPhoto, onDeletePhoto, readOnly }) {
  const [open, setOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [photoErr, setPhotoErr] = useState("");
  const photoRef = useRef();
  const pct = mark?.pct ?? 0;
  const rag = mark?.rag ?? "green";
  const color = RAG[rag].dot;
  const photos = goal.photos || [];

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setPhotoErr("Image is larger than 15MB — pick a smaller one.");
      return;
    }
    try {
      setPhotoErr("");
      await onAddPhoto(goal.id, file);   // hands the raw File to Supabase Storage
    } catch (err) {
      setPhotoErr(err.message || "Upload failed.");
    }
  };

  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14,
      padding: "18px 20px", borderLeft: `3px solid ${color}`, boxShadow: "0 1px 2px rgba(19,34,41,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {(() => {
            const fDef = FS.find((x) => x.key === goal.f);
            if (!fDef) return null;
            const FIcon = fDef.icon;
            return (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6,
                background: C.redSoft, color: C.redDk, padding: "3px 10px 3px 8px",
                borderRadius: 99, fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em",
                textTransform: "uppercase", border: `1px solid ${C.redLine}`, marginBottom: 9 }}>
                <FIcon size={12} /> {fDef.label}
              </span>
            );
          })()}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h4 style={{ ...display, fontSize: 17, margin: 0, color: C.text }}>{goal.title}</h4>
            <RagPill rag={rag} />
          </div>
          {mark?.note && <p style={{ margin: "8px 0 0", fontSize: 13.5, color: C.sub, lineHeight: 1.55 }}>{mark.note}</p>}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ ...display, fontSize: 26, color, lineHeight: 1 }}>{pct}<span style={{ fontSize: 14 }}>%</span></div>
          {mark && <div style={{ fontSize: 10, color: C.faint, marginTop: 4, letterSpacing: ".04em" }}>{monthLabel(mark.month)}</div>}
        </div>
      </div>

      <div style={{ marginTop: 14 }}><Bar value={pct} color={color} /></div>

      {(mark?.blockers || mark?.commitment) && (
        <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
          {mark.blockers && (
            <div style={{ fontSize: 12.5, color: C.redDk, display: "flex", gap: 7 }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span><b style={{ fontWeight: 700 }}>Blockers:</b> {mark.blockers}</span>
            </div>
          )}
          {mark.commitment && (
            <div style={{ fontSize: 12.5, color: "#1F6B40", display: "flex", gap: 7 }}>
              <Flag size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span><b style={{ fontWeight: 700 }}>Next month:</b> {mark.commitment}</span>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
        {!readOnly && (
          <button onClick={onMark} style={smallBtn}><Compass size={14} /> Log Mile Marker</button>
        )}
        <button onClick={() => setOpen(!open)} style={smallGhost}>
          {open ? "Hide details" : `Details${history.length ? ` · ${history.length}` : ""}${photos.length ? ` · ${photos.length} 📷` : ""}`}
        </button>
        {!readOnly && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            <button onClick={onEdit} style={iconBtnSm}><Edit3 size={14} /></button>
            <button onClick={onDelete} style={iconBtnSm}><X size={14} /></button>
          </div>
        )}
      </div>

      {open && (
        <div style={{ marginTop: 14, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
          <div style={{ display: "grid", gap: 4, marginBottom: 14 }}>
            {[["S", goal.smart?.s], ["M", goal.smart?.m], ["A", goal.smart?.a], ["R", goal.smart?.r], ["T", goal.smart?.t]]
              .filter(([, v]) => v).map(([k, v]) => (
                <div key={k} style={{ fontSize: 12, color: C.sub, display: "flex", gap: 8 }}>
                  <span style={{ ...display, color: C.red, width: 14 }}>{k}</span>{v}
                </div>
              ))}
          </div>
          {history.slice().reverse().map((h, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0",
              fontSize: 12.5, color: C.sub, borderTop: i ? `1px dotted ${C.line}` : "none" }}>
              <span>{monthLabel(h.month)}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <RagPill rag={h.rag} /><b style={{ ...display, color: RAG[h.rag].dot }}>{h.pct}%</b>
              </span>
            </div>
          ))}

          {/* photo gallery */}
          <div style={{ marginTop: 16, borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ ...kicker }}>Progress photos {photos.length ? `· ${photos.length}` : ""}</span>
              {!readOnly && (
                <button onClick={() => photoRef.current?.click()} style={smallBtn}>
                  <Camera size={13} /> Add photo
                </button>
              )}
              <input ref={photoRef} type="file" accept="image/*" capture="environment"
                onChange={pickPhoto} style={{ display: "none" }} />
            </div>
            {photoErr && <div style={{ fontSize: 12, color: C.redDk, marginBottom: 8 }}>{photoErr}</div>}
            {photos.length === 0 ? (
              <div style={{ fontSize: 12.5, color: C.faint }}>
                No photos yet{!readOnly && " — add a scale shot, a screenshot, anything that shows the proof."}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {photos.slice().sort((a, b) => b.ts - a.ts).map((ph) => (
                  <div key={ph.id} style={{ position: "relative" }}>
                    <img src={ph.dataUrl} alt="" onClick={() => setLightbox(ph)}
                      style={{ width: 86, height: 86, objectFit: "cover", borderRadius: 10,
                        border: `1px solid ${C.line}`, cursor: "zoom-in", display: "block" }} />
                    <div style={{ fontSize: 9.5, color: C.faint, marginTop: 4, textAlign: "center",
                      letterSpacing: ".02em" }}>
                      {new Date(ph.ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                    </div>
                    {!readOnly && (
                      <button onClick={() => onDeletePhoto(goal.id, ph.id)} style={{
                        position: "absolute", top: -7, right: -7, width: 20, height: 20, borderRadius: 99,
                        border: "none", background: C.red, color: "#fff", cursor: "pointer",
                        fontSize: 11, lineHeight: 1, display: "grid", placeItems: "center" }}>×</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ ...overlay, cursor: "zoom-out" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "90vw", maxHeight: "90vh",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <img src={lightbox.dataUrl} alt="" style={{ maxWidth: "90vw", maxHeight: "78vh",
              objectFit: "contain", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#fff" }}>
              <span style={{ fontSize: 13 }}>
                {new Date(lightbox.ts).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
              </span>
              <button onClick={() => setLightbox(null)} style={{ ...smallGhost, color: "#fff" }}>
                <X size={14} /> Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  DASHBOARD                                                          */
/* ------------------------------------------------------------------ */

function Dashboard({ st, setSt, personId, readOnly, onBack, onEditProfile }) {
  const person = st.people[personId];
  const [activeF, setActiveF] = useState("all");
  const [markGoal, setMarkGoal] = useState(null);
  const [goalModal, setGoalModal] = useState(null);
  const goals = personGoals(st, personId);
  const ov = overall(st, personId);

  const commitMark = useCallback(async (gid, data) => {
    const mk = monthKey();
    await upsertMark(gid, { month: mk, ...data });
    setSt((prev) => {
      const n = structuredClone(prev);
      const arr = n.marks[gid] || [];
      const i = arr.findIndex((x) => x.month === mk);
      const e = { month: mk, ts: Date.now(), ...data };
      if (i >= 0) arr[i] = e; else arr.push(e);
      n.marks[gid] = arr; return n;
    });
    setMarkGoal(null);
  }, [setSt]);

  const commitGoal = useCallback(async (payload, ex) => {
    const id = await upsertGoal(personId, ex ? { ...ex, ...payload } : payload);
    setSt((prev) => {
      const n = structuredClone(prev);
      const list = n.goals[personId] || [];
      if (ex) {
        const i = list.findIndex((g) => g.id === ex.id);
        if (i >= 0) list[i] = { ...list[i], ...payload };
      } else {
        list.push({ id, photos: [], ...payload });
      }
      n.goals[personId] = list; return n;
    });
    setGoalModal(null);
  }, [setSt, personId]);

  const removeGoal = useCallback(async (gid) => {
    await deleteGoalRow(gid);
    setSt((prev) => {
      const n = structuredClone(prev);
      n.goals[personId] = (n.goals[personId] || []).filter((g) => g.id !== gid);
      delete n.marks[gid]; return n;
    });
  }, [setSt, personId]);

  const addPhoto = useCallback(async (gid, file) => {
    const photo = await addPhotoRow(personId, gid, file);
    setSt((prev) => {
      const n = structuredClone(prev);
      const g = (n.goals[personId] || []).find((x) => x.id === gid);
      if (g) { g.photos = g.photos || []; g.photos.push(photo); }
      return n;
    });
  }, [setSt, personId]);

  const deletePhoto = useCallback(async (gid, pid) => {
    const g = (st.goals[personId] || []).find((x) => x.id === gid);
    const ph = (g?.photos || []).find((p) => p.id === pid);
    await deletePhotoRow(pid, ph?.storage_path);
    setSt((prev) => {
      const n = structuredClone(prev);
      const g2 = (n.goals[personId] || []).find((x) => x.id === gid);
      if (g2) g2.photos = (g2.photos || []).filter((p) => p.id !== pid);
      return n;
    });
  }, [setSt, personId, st]);

  const visible = activeF === "all" ? goals : goals.filter((g) => g.f === activeF);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px 80px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        flexWrap: "wrap", gap: 20, padding: "32px 0 26px" }}>
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <div>
            {onBack && <button onClick={onBack} style={{ ...smallGhost, marginBottom: 12, paddingLeft: 0 }}><ArrowLeft size={14} /> Back</button>}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar person={person} size={56} />
              <div>
                <div style={kicker}>{person.retreat} · Game Plan</div>
                <h1 style={{ ...display, fontSize: 34, margin: "6px 0 0", color: C.text, lineHeight: 1 }}>
                  {person.name}
                </h1>
                <div style={{ fontSize: 12.5, color: C.sub, marginTop: 5, letterSpacing: ".02em" }}>
                  {readOnly ? "Mile Markers" : "Your Mile Markers"}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {!readOnly && (
            <button onClick={onEditProfile} style={smallGhost}><Camera size={14} /> Edit profile</button>
          )}
          <div style={{ textAlign: "right" }}>
            <div style={kicker}>Overall</div>
            <div style={{ ...display, fontSize: 30, color: C.red, marginTop: 4 }}>{ov}%</div>
          </div>
          <div style={{ position: "relative" }}>
            <Ring value={ov} />
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><Mark size={26} /></div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginBottom: 24 }}>
        {FS.map((f) => {
          const p = fProgress(st, personId, f.key); const Ic = f.icon;
          const on = activeF === f.key;
          const count = goals.filter((g) => g.f === f.key).length;
          return (
            <button key={f.key} onClick={() => setActiveF(on ? "all" : f.key)} title={`Show ${f.label} goals`}
              style={{
                textAlign: "left", cursor: "pointer", padding: "16px 16px 18px", borderRadius: 14,
                border: on ? `2px solid ${C.red}` : `1px solid ${C.line}`,
                background: on ? "#FFF5F7" : C.panel,
                boxShadow: on ? "0 4px 16px rgba(213,0,50,0.16)" : "0 1px 2px rgba(19,34,41,0.04)",
                transform: on ? "translateY(-2px)" : "none",
                transition: "all 180ms" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Ic size={17} color={on ? C.red : C.sub} />
                <span style={{ ...display, fontSize: 19, color: p === null ? C.faint : (on ? C.red : C.text) }}>
                  {p === null ? "—" : `${p}%`}
                </span>
              </div>
              <div style={{ ...display, fontSize: 16, marginTop: 12, color: C.text }}>{f.label}</div>
              <div style={{ fontSize: 11.5, color: C.faint, marginTop: 3 }}>{f.blurb}</div>
              <div style={{ marginTop: 10 }}><Bar value={p ?? 0} /></div>
              <div style={{ fontSize: 10.5, color: on ? C.red : C.faint, marginTop: 9,
                letterSpacing: ".04em", fontWeight: 600 }}>
                {on ? "✓ SHOWING THIS F" : `TAP TO VIEW · ${count} GOAL${count !== 1 ? "S" : ""}`}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {activeF === "all" ? (
            <span style={{ fontSize: 13, color: C.sub }}>
              All goals <span style={{ color: C.faint }}>· {visible.length} across all 5 F's</span>
            </span>
          ) : (
            <>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8,
                background: C.redSoft, color: C.redDk, padding: "5px 12px 5px 13px",
                borderRadius: 99, fontSize: 12.5, fontWeight: 700, border: `1px solid ${C.redLine}` }}>
                {FS.find((x) => x.key === activeF)?.label}
                <span style={{ color: C.red, opacity: 0.7 }}>
                  · {fProgress(st, personId, activeF) ?? 0}%
                </span>
                <button onClick={() => setActiveF("all")} title="Clear filter"
                  style={{ border: "none", background: "transparent", color: C.redDk,
                    cursor: "pointer", display: "grid", placeItems: "center", padding: 0,
                    marginLeft: 2 }}>
                  <X size={13} />
                </button>
              </span>
              <span style={{ fontSize: 12.5, color: C.faint }}>
                {visible.length} goal{visible.length !== 1 ? "s" : ""} in this F
              </span>
            </>
          )}
        </div>
        {!readOnly && (
          <button onClick={() => setGoalModal({ fKey: activeF === "all" ? "faith" : activeF })} style={primaryBtn}>
            <Plus size={16} /> Add SMART goal
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 20px", border: `1.5px dashed ${C.lineHi}`,
          borderRadius: 16, color: C.sub, background: C.panel }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><Mark size={34} /></div>
          <div style={{ ...display, fontSize: 18, color: C.text }}>No goals here yet</div>
          <p style={{ fontSize: 13.5, margin: "8px auto 0", maxWidth: 360, lineHeight: 1.6 }}>
            {readOnly ? "This man hasn't entered goals for this area yet."
              : "Add the SMART goals you set at the retreat. 2–3 per F is the rhythm."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {visible.map((g) => (
            <GoalCard key={g.id} goal={g} mark={goalLatest(st, g.id)} history={st.marks[g.id] || []}
              readOnly={readOnly} onMark={() => setMarkGoal(g)}
              onEdit={() => setGoalModal({ existing: g })} onDelete={() => removeGoal(g.id)}
              onAddPhoto={addPhoto} onDeletePhoto={deletePhoto} />
          ))}
        </div>
      )}

      {markGoal && (
        <MarkModal goal={markGoal}
          existing={(st.marks[markGoal.id] || []).find((x) => x.month === monthKey())}
          onSave={(d) => commitMark(markGoal.id, d)} onClose={() => setMarkGoal(null)} />
      )}
      {goalModal && (
        <GoalModal fKey={goalModal.fKey} existing={goalModal.existing}
          onSave={(p) => commitGoal(p, goalModal.existing)} onClose={() => setGoalModal(null)} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TEAM DASHBOARD — roster grid                                       */
/* ------------------------------------------------------------------ */

function TeamDashboard({ st, selfId, onOpen }) {
  // Show everyone the viewer is allowed to see, but float self to the top.
  const all = Object.values(st.people);
  const people = [
    ...all.filter((p) => p.id === selfId),
    ...all.filter((p) => p.id !== selfId),
  ];

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px 80px" }}>
      <div style={{ padding: "36px 0 26px" }}>
        <img src={LOGO_EQUILIBRIUM} alt="Equilibrium"
          style={{ height: 64, width: "auto", display: "block", marginBottom: 22 }} />
        <div style={kicker}>The Brotherhood</div>
        <h1 style={{ ...display, fontSize: 36, margin: "8px 0 6px", color: C.text }}>The Men You Walk With</h1>
        <p style={{ fontSize: 14, color: C.sub, maxWidth: 580, lineHeight: 1.6 }}>
          Every man's game plan at a glance for the monthly Mile Marker meeting. Tap a man to drill into his goals.
        </p>
      </div>

      {/* roster */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 16 }}>
        {people.map((p) => {
          const o = overall(st, p.id);
          const gc = personGoals(st, p.id).length;
          const wr = worstRag(st, p.id);
          return (
            <button key={p.id} onClick={() => onOpen(p.id)} style={{
              textAlign: "left", cursor: "pointer", padding: "20px", borderRadius: 16,
              border: `1px solid ${C.line}`, background: C.panel, boxShadow: "0 1px 2px rgba(19,34,41,0.04)",
              transition: "transform 160ms, box-shadow 160ms, border-color 160ms" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 10px 26px rgba(19,34,41,0.10)"; e.currentTarget.style.borderColor = C.redLine; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 2px rgba(19,34,41,0.04)"; e.currentTarget.style.borderColor = C.line; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Avatar person={p} size={52} />
                <div style={{ position: "relative" }}>
                  <Ring value={o} size={52} stroke={5} />
                  <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center",
                    ...display, fontSize: 13, color: C.text }}>{o}%</span>
                </div>
              </div>
              <div style={{ ...display, fontSize: 20, marginTop: 14, color: C.text }}>{p.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {wr ? <RagPill rag={wr} /> : <span style={{ fontSize: 11.5, color: C.faint }}>No marks yet</span>}
              </div>
              <div style={{ fontSize: 12.5, color: C.sub, marginTop: 12, display: "flex", alignItems: "center", gap: 6,
                borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
                <Target size={13} /> {gc} goal{gc !== 1 ? "s" : ""} tracked
                <ChevronRight size={14} style={{ marginLeft: "auto" }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ROOT                                                               */
/* ------------------------------------------------------------------ */

export default function App({ initialView }) {
  const { session, profile } = useAuth();
  const nav = useNavigate();
  const { personId: routePersonId } = useParams();

  const SELF = session?.user?.id;
  const role = profile?.role ?? "mentee";

  const [st, setStRaw] = useState(null);
  const [loadErr, setLoadErr] = useState("");
  const [view, setView] = useState(initialView ?? "mentee");
  const [target, setTarget] = useState(routePersonId ?? null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => { setTarget(routePersonId ?? null); }, [routePersonId]);
  useEffect(() => { if (initialView) setView(initialView); }, [initialView]);

  useEffect(() => {
    if (!SELF) return;
    let cancelled = false;
    loadState(SELF)
      .then((s) => { if (!cancelled) setStRaw(s); })
      .catch((e) => { if (!cancelled) setLoadErr(e.message || "Failed to load."); });
    return () => { cancelled = true; };
  }, [SELF]);

  const setSt = useCallback((u) => {
    setStRaw((prev) => (typeof u === "function" ? u(prev) : u));
  }, []);

  const saveProfile = useCallback(async (data) => {
    await updateProfile(SELF, data);
    setSt((prev) => {
      const n = structuredClone(prev);
      n.people[SELF] = { ...n.people[SELF], ...data };
      return n;
    });
    setEditingProfile(false);
  }, [setSt, SELF]);

  if (loadErr) {
    return (
      <div style={{ ...page, display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <style>{fonts}</style>
        <div style={{ textAlign: "center", color: C.redDk, maxWidth: 460, padding: 20 }}>
          <div style={{ ...display, fontSize: 18, marginBottom: 8 }}>Couldn't load your data</div>
          <div style={{ fontSize: 13, color: C.sub }}>{loadErr}</div>
        </div>
      </div>
    );
  }

  if (!st || !SELF) {
    return (
      <div style={{ ...page, display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <style>{fonts}</style>
        <div style={{ textAlign: "center", color: C.sub }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14,
            animation: "p 1.4s ease-in-out infinite" }}><Mark size={36} /></div>
          <div style={{ ...display, fontSize: 16 }}>Loading your game plan…</div>
        </div>
        <style>{`@keyframes p{0%,100%{opacity:.35}50%{opacity:1}}`}</style>
      </div>
    );
  }

  return (
    <div style={page}>
      <style>{fonts}</style>
      <div style={{ borderBottom: `1px solid ${C.line}`, background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "14px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img src={LOGO_EQUILIBRIUM} alt="Equilibrium"
              style={{ height: 34, width: "auto", display: "block" }} />
            <div style={{ borderLeft: `1px solid ${C.line}`, paddingLeft: 14 }}>
              <div style={{ ...wordmark, fontSize: 14, color: C.ink, lineHeight: 1 }}>
                MILE MARKER
              </div>
              <div style={{ fontSize: 9, letterSpacing: ".18em", color: C.faint, marginTop: 4 }}>
                5F GAME PLAN
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", gap: 4, background: C.shell, padding: 4, borderRadius: 10,
              border: `1px solid ${C.line}` }}>
              {[["mentee", "My Dashboard", "/"], ["team", "Team", "/team"]].map(([k, lab, path]) => (
                <button key={k} onClick={() => nav(path)} style={{
                  padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 700,
                  border: "none", background: view === k ? C.red : "transparent",
                  color: view === k ? "#fff" : C.sub, letterSpacing: ".02em" }}>{lab}</button>
              ))}
            </div>
            {(role === "admin" || role === "mentor") && (
              <button onClick={() => setInviteOpen(true)} style={smallBtn} title="Invite a new man">
                <UserPlus size={14} /> Invite
              </button>
            )}
            <button onClick={signOut} style={smallGhost} title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ paddingTop: 4 }}>
        {view === "mentee" && (
          <Dashboard st={st} setSt={setSt} personId={SELF} readOnly={false}
            onEditProfile={() => setEditingProfile(true)} />
        )}
        {view === "team" && !target && (
          <TeamDashboard st={st} selfId={SELF} onOpen={(id) => nav(`/team/${id}`)} />
        )}
        {view === "team" && target && (
          <Dashboard st={st} setSt={setSt} personId={target}
            readOnly={target !== SELF}
            onEditProfile={() => setEditingProfile(true)}
            onBack={() => nav("/team")} />
        )}
      </div>

      {editingProfile && (
        <ProfileModal person={st.people[SELF]} onSave={saveProfile}
          onClose={() => setEditingProfile(false)} />
      )}

      {inviteOpen && (
        <InviteModal callerGroupId={profile?.group_id}
          onClose={() => setInviteOpen(false)} />
      )}

      <div style={{ textAlign: "center", padding: "40px 0 50px", display: "flex",
        flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ fontSize: 11, color: C.faint, letterSpacing: ".03em" }}>
          Iron sharpens iron · Faith · Family · Friends · Fitness · Finances
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          paddingTop: 18, borderTop: `1px solid ${C.line}`, width: "100%", maxWidth: 240 }}>
          <span style={{ fontSize: 9.5, letterSpacing: ".18em", color: C.faint, textTransform: "uppercase" }}>
            A ministry of
          </span>
          <img src={LOGO_MEN_OF_IRON} alt="Men of Iron"
            style={{ height: 52, width: "auto", display: "block", opacity: 0.9 }} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STYLES                                                             */
/* ------------------------------------------------------------------ */

const fonts = `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Barlow:wght@400;500;600;700&display=swap');
*{ -webkit-font-smoothing:antialiased; box-sizing:border-box; }
input[type=range]{ height:4px; }
::placeholder{ color:${C.faint}; }
`;

const display = { fontFamily: "'Oswald', sans-serif", fontWeight: 600, letterSpacing: ".005em" };
const wordmark = { fontFamily: "'Oswald', sans-serif", fontWeight: 700, letterSpacing: ".10em" };

const page = {
  minHeight: "100vh",
  background: C.shell,
  fontFamily: "'Barlow', system-ui, sans-serif",
  color: C.text,
};

const kicker = {
  fontFamily: "'Oswald', sans-serif", fontSize: 11, letterSpacing: ".20em",
  textTransform: "uppercase", color: C.red, fontWeight: 600,
};

const overlay = {
  position: "fixed", inset: 0, background: "rgba(19,34,41,0.45)", backdropFilter: "blur(3px)",
  display: "grid", placeItems: "center", zIndex: 100, padding: 20, overflowY: "auto",
};
const sheet = {
  background: C.bg, borderRadius: 18, padding: "26px 28px", width: "100%",
  boxShadow: "0 30px 70px rgba(19,34,41,0.28)", border: `1px solid ${C.line}`,
  maxHeight: "90vh", overflowY: "auto",
};
const lbl = { fontSize: 12.5, fontWeight: 600, color: C.sub, letterSpacing: ".01em" };
const inp = {
  width: "100%", marginTop: 7, padding: "10px 13px", borderRadius: 9,
  border: `1.5px solid ${C.line}`, background: "#FBFBFB",
  fontFamily: "'Barlow', sans-serif", fontSize: 14, color: C.text, outline: "none",
};
const primaryBtn = {
  display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px",
  borderRadius: 9, border: "none", cursor: "pointer", background: C.red,
  color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "'Barlow', sans-serif",
  letterSpacing: ".02em",
};
const smallBtn = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px",
  borderRadius: 8, border: `1px solid ${C.redLine}`, cursor: "pointer",
  background: C.redSoft, color: C.redDk, fontSize: 12.5, fontWeight: 700,
  fontFamily: "'Barlow', sans-serif",
};
const smallGhost = {
  display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px",
  borderRadius: 8, border: "none", cursor: "pointer", background: "transparent",
  color: C.sub, fontSize: 12.5, fontWeight: 600, fontFamily: "'Barlow', sans-serif",
};
const iconBtn = {
  width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
  background: C.shell, color: C.sub, display: "grid", placeItems: "center",
};
const iconBtnSm = {
  width: 28, height: 28, borderRadius: 7, border: "none", cursor: "pointer",
  background: "transparent", color: C.faint, display: "grid", placeItems: "center",
};
