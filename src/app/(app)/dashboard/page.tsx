function AuthorizedApplicationList() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const applicationsQuery = useMemoFirebase(() => {
      if (!firestore || !user?.uid) return null;
      return query(
          collection(firestore, "applications"),
          where("userId", "==", user.uid),
          orderBy("submittedAt", "desc")
      ) as any;
  }, [firestore, user?.uid]);
  
  const [allApplications, setAllApplications] = React.useState<Application[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
      if (!applicationsQuery) {
          setIsLoading(false);
          return;
      }
      
      const unsubscribe = onSnapshot(applicationsQuery, (snapshot) => {
          const apps: Application[] = [];
          snapshot.forEach((doc) => {
              apps.push({ id: doc.id, ...(doc.data() as Application) });
          });
          setAllApplications(apps);
          setIsLoading(false);
      });
      
      return () => unsubscribe();
  }, [applicationsQuery]);

  // renderTableBody stays EXACTLY the same as before
  const renderTableBody = () => {
      // ... your existing renderTableBody code ...
  }

  return (
      // ... your existing JSX ...
  );
}
