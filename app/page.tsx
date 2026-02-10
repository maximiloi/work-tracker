export default function Home() {
  return (
    <div className='flex min-h-screen flex-col bg-white'>
      <main className='flex-1'>
        <section className='container mx-auto px-4 py-32'>
          <div className='mx-auto max-w-4xl text-center'>
            <h1 className='text-black mb-6 text-6xl font-bold capitalize'>
              work tracker
            </h1>
            <p className='text-muted-foreground mb-10'>
              Организуй свое рабочее пространство прямо сейчас
            </p>
          </div>
          <div className='flex flex-col items-center gap-4'>
            <button>Начать</button>
          </div>
        </section>
      </main>
    </div>
  );
}
